import { useState, useEffect } from 'react'

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
        <div className="tile-label">FCR ADOPTION</div>
        <div className="tile-value" style={{ color: 'var(--green)' }}>{adoption}%</div>
        <div className="tile-sub">{summary?.fcrValidators?.toLocaleString() ?? '—'} / {summary?.totalValidators?.toLocaleString() ?? '—'} validators</div>
      </div>

      <div className="tile">
        <div className="tile-label">LAST FCR BLOCK</div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>#{blockNumber.toLocaleString?.() ?? blockNumber}</div>
        <div className="tile-sub">slot {summary?.slot?.toLocaleString() ?? '—'}</div>
      </div>

      <div className="tile">
        <div className="tile-label">SLOT AGE</div>
        <div className="tile-value" style={{ color: slotAge > 20 ? 'var(--amber)' : 'var(--green)' }}>+{slotAge}s</div>
        <div className="tile-sub">since last confirmed slot</div>
      </div>

      <div className="tile">
        <div className="tile-label">SYNC HEALTH</div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: healthColor(syncHealth) }}>{syncHealth}</div>
        <div className="tile-sub">participation {summary?.attestationPct ?? '—'}%</div>
      </div>
    </div>
  )
}
