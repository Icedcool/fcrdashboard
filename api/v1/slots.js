// GET /api/v1/slots?limit=50
// Returns array of recent slot objects.

import { beaconGet } from '../lib/beacon.js'
import { xatuQuery } from '../lib/xatu.js'

const FCR_CLIENTS = ['Lodestar', 'Lighthouse']

function classifyClient(graffitiText) {
  if (!graffitiText) return null
  if (graffitiText.includes('Lodestar')) return 'Lodestar'
  if (graffitiText.includes('Lighthouse')) return 'Lighthouse'
  if (graffitiText.includes('rysm')) return 'Prysm'
  if (graffitiText.includes('eku')) return 'Teku'
  if (graffitiText.includes('imbus')) return 'Nimbus'
  return null
}

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=12, stale-while-revalidate=6')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const limit = Math.min(parseInt(req.query?.limit || '50', 10), 200)

    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    const rows = await xatuQuery(`
      SELECT slot, graffiti_text, slot_start_date_time, attestations_count
      FROM default.canonical_beacon_block
      WHERE slot >= ${headSlot - 300}
      ORDER BY slot DESC
      LIMIT ${limit}
    `)

    const rowMap = Object.fromEntries(rows.map(r => [parseInt(r.slot), r]))
    const now = Date.now()
    const slots = []

    for (let i = 0; i < limit; i++) {
      const slot = headSlot - i
      const row = rowMap[slot]

      if (!row) {
        slots.push({ slot, status: 'MISSED', attestPct: null, ageMs: i * 12000, proposer: null, ts: now - i * 12000 })
        continue
      }

      const ts = new Date(row.slot_start_date_time).getTime()
      const ageMs = now - ts
      const proposer = classifyClient(row.graffiti_text)
      const attestPct = row.attestations_count
        ? parseFloat(Math.min(100, parseFloat(row.attestations_count) / 128.0 * 100).toFixed(1))
        : null

      // Slots within the last 2 epochs (64 slots) are FAST_CONFIRMED if attestPct >= 75, else FINALIZED
      const recentEnough = slot >= headSlot - 64
      const status = recentEnough && attestPct != null && attestPct >= 75
        ? 'FAST_CONFIRMED'
        : 'FINALIZED'

      slots.push({ slot, status, attestPct, ageMs, proposer, ts })
    }

    staleCache = slots
    res.json(slots)
  } catch (err) {
    console.error('slots error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
