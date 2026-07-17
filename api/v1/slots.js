// GET /api/v1/slots?limit=30
import { beaconGet, fetchBlock, fetchFinality, decodeGraffiti, classifyClient, GENESIS_TIME_MS } from '../lib/beacon.js'
import { participationByTargetSlot } from '../lib/attestations.js'

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=12, stale-while-revalidate=6')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const limit = Math.min(parseInt(req.query?.limit || '30', 10), 50)

    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    const [results, finality] = await Promise.all([
      Promise.all(Array.from({ length: limit }, (_, i) => fetchBlock(headSlot - i))),
      fetchFinality().catch(() => null),
    ])

    // Participation per attested slot, measured from aggregation bitfields
    // across the whole fetched window (attestations for slot N are included
    // in blocks N+1, N+2, ...).
    const partMap = participationByTargetSlot(results)

    const now = Date.now()
    const slots = results.map((r, i) => {
      const slot = headSlot - i
      const ts = GENESIS_TIME_MS + slot * 12000
      const ageMs = now - ts

      if (r.error) {
        return { slot, status: 'NO_DATA', attestPct: null, attesting: null, committeeMembers: null, ageMs, proposer: null, ts }
      }
      if (r.missed) {
        return { slot, status: 'MISSED', attestPct: null, attesting: null, committeeMembers: null, ageMs, proposer: null, ts }
      }

      const body = r.block.data.message.body
      const proposer = classifyClient(decodeGraffiti(body.graffiti))
      // Require solid committee coverage; a slot only seen via late partial
      // aggregates has an unknown participation, not a low one.
      const m = partMap.get(slot)
      const measured = m && m.committeesCovered >= 32 ? m : null

      let status
      if (finality && Math.floor(slot / 32) <= finality.finalizedEpoch) {
        status = 'FINALIZED'
      } else if (!measured) {
        status = 'PENDING'
      } else if (measured.pct >= 75) {
        // Estimate: participation meets the FCR threshold, so this block would
        // be fast-confirmable — no client runs FCR in production yet.
        status = 'FAST_CONF_EST'
      } else {
        status = 'LOW_PARTICIP'
      }

      return {
        slot,
        status,
        attestPct: measured?.pct ?? null,
        attesting: measured?.attesting ?? null,
        committeeMembers: measured?.committeeMembers ?? null,
        ageMs,
        proposer,
        ts,
      }
    })

    staleCache = slots
    res.json(slots)
  } catch (err) {
    console.error('slots error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
