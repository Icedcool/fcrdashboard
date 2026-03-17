import { useState, useEffect } from 'react'
import Tooltip from './Tooltip.jsx'

function healthColor(h) {
  if (h === 'NOMINAL')  return 'var(--green)'
  if (h === 'DEGRADED') return 'var(--amber)'
  return 'var(--red)'
}

export default function HeroMetrics({ summary }) {
  const [slotAge, setSlotAge] = useState(0)

  useEffect(() => {
    if (!summary?.slotTime) return
    const update = () => setSlotAge(Math.floor((Date.now() - summary.slotTime) / 1000))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [summary?.slotTime])

  const adoption     = summary?.adoptionPct?.toFixed(1)   ?? '—'
  const blockNumber  = summary?.blockNumber               ?? '—'
  const syncHealth   = summary?.syncHealth                ?? '—'

  return (
    <div className="grid-4 section">
      <div className="tile">
        <div className="tile-label">FCR ADOPTION <Tooltip text="% of active validators running FCR-enabled clients (Lodestar, Lighthouse). Needs ≥75% for fast confirmation to trigger network-wide." /></div>
        <div className="tile-value" style={{ color: 'var(--green)' }}>{adoption}%</div>
        <div className="tile-sub">{summary?.fcrValidators?.toLocaleString() ?? '—'} / {summary?.totalValidators?.toLocaleString() ?? '—'} validators</div>
      </div>

      <div className="tile">
        <div className="tile-label">LAST FCR BLOCK <Tooltip text="Execution layer block number from the most recent beacon slot head. This is the block eligible for fast confirmation if the ≥75% attestation threshold is met." /></div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>#{blockNumber.toLocaleString?.() ?? blockNumber}</div>
        <div className="tile-sub">slot {summary?.slot?.toLocaleString() ?? '—'}</div>
      </div>

      <div className="tile">
        <div className="tile-label">SLOT AGE <Tooltip text="Seconds since the current beacon slot began. Slots are exactly 12 seconds. Age >12s means you are seeing the previous slot's data while waiting for the next block." align="right" /></div>
        <div className="tile-value" style={{ color: slotAge > 20 ? 'var(--amber)' : 'var(--green)' }}>+{slotAge}s</div>
        <div className="tile-sub">since last confirmed slot</div>
      </div>

      <div className="tile">
        <div className="tile-label">SYNC HEALTH <Tooltip text={"NOMINAL — participation ≥95%, FCR fully operational\nDEGRADED — participation 75–95%, FCR borderline\nUNSAFE — participation <75%, FCR threshold cannot be met, falls back to 2-epoch finality"} align="right" /></div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: healthColor(syncHealth) }}>{syncHealth}</div>
        <div className="tile-sub">participation {summary?.attestationPct ?? '—'}%</div>
      </div>
    </div>
  )
}
