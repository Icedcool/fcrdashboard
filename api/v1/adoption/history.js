// GET /api/v1/adoption/history
// Fetches 2 beacon blocks per day for 90 days and derives FCR adoption from graffiti.
import { beaconGet, decodeGraffiti, GENESIS_TIME_MS } from '../../lib/beacon.js'

const SLOTS_PER_DAY = 7200
const BATCH_SIZE = 30

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    // 2 samples per day × 90 days = 180 slots, fetched in batches of 30
    const DAYS = 90
    const requests = []
    for (let dayAgo = 1; dayAgo <= DAYS; dayAgo++) {
      const mid = headSlot - dayAgo * SLOTS_PER_DAY
      requests.push({ slot: mid - 1800, dayAgo })
      requests.push({ slot: mid + 1800, dayAgo })
    }

    const blockResults = new Array(requests.length).fill(null)
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE)
      const blocks = await Promise.all(
        batch.map(({ slot }) => beaconGet(`/eth/v2/beacon/blocks/${slot}`).catch(() => null))
      )
      blocks.forEach((b, j) => { blockResults[i + j] = b })
    }

    const history = []
    for (let dayAgo = DAYS; dayAgo >= 1; dayAgo--) {
      const idxs = requests.map((r, i) => r.dayAgo === dayAgo ? i : -1).filter(i => i >= 0)
      const dayBlocks = idxs.map(i => blockResults[i]).filter(Boolean)
      if (dayBlocks.length === 0) continue

      const fcrCount = dayBlocks.filter(b => {
        const g = decodeGraffiti(b.data.message.body.graffiti)
        return g.includes('Lodestar') || g.includes('Lighthouse')
      }).length

      const adoptionPct = parseFloat((fcrCount / dayBlocks.length * 100).toFixed(2))
      const thresholdMetPct = parseFloat(Math.max(0, adoptionPct - 5).toFixed(2))
      const date = new Date(GENESIS_TIME_MS + (headSlot - dayAgo * SLOTS_PER_DAY) * 12000)
        .toISOString().slice(0, 10)

      history.push({ date, adoptionPct, thresholdMetPct })
    }

    staleCache = history
    res.json(history)
  } catch (err) {
    console.error('history error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
