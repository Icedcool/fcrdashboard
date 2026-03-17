// GET /api/v1/slots?limit=30
import { beaconGet, decodeGraffiti, classifyClient, GENESIS_TIME_MS } from '../lib/beacon.js'

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=12, stale-while-revalidate=6')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const limit = Math.min(parseInt(req.query?.limit || '30', 10), 50)

    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    const rawBlocks = await Promise.all(
      Array.from({ length: limit }, (_, i) =>
        beaconGet(`/eth/v2/beacon/blocks/${headSlot - i}`).catch(() => null)
      )
    )

    const now = Date.now()
    const slots = rawBlocks.map((block, i) => {
      const slot = headSlot - i
      const ts = GENESIS_TIME_MS + slot * 12000
      const ageMs = now - ts

      if (!block) {
        return { slot, status: 'MISSED', attestPct: null, ageMs, proposer: null, ts }
      }

      const body = block.data.message.body
      const graffiti = decodeGraffiti(body.graffiti)
      const proposer = classifyClient(graffiti)
      const attestCount = body.attestations?.length ?? 0
      const attestPct = parseFloat(Math.min(100, attestCount / 128 * 100).toFixed(1))
      const status = i < 64 && attestPct >= 75 ? 'FAST_CONFIRMED' : 'FINALIZED'

      return { slot, status, attestPct, ageMs, proposer, ts }
    })

    staleCache = slots
    res.json(slots)
  } catch (err) {
    console.error('slots error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
