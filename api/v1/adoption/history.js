// GET /api/v1/adoption/history
// Returns 90 days of daily FCR adoption data.

import { xatuQuery } from '../../lib/xatu.js'

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const rows = await xatuQuery(`
      SELECT
        toDate(slot_start_date_time) AS date,
        countIf(
          graffiti_text LIKE '%Lodestar%' OR graffiti_text LIKE '%Lighthouse%'
        ) * 100.0 / count() AS adoptionPct,
        count() AS total_blocks
      FROM default.canonical_beacon_block
      WHERE slot_start_date_time >= now() - INTERVAL 90 DAY
        AND slot_start_date_time < today()
      GROUP BY date
      ORDER BY date
    `)

    const history = rows.map(r => {
      const adoptionPct = parseFloat(parseFloat(r.adoptionPct).toFixed(2))
      const thresholdMetPct = parseFloat(Math.max(0, adoptionPct - 5).toFixed(2))
      return { date: r.date, adoptionPct, thresholdMetPct }
    })

    staleCache = history
    res.json(history)
  } catch (err) {
    console.error('history error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
