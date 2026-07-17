import { useState, useEffect } from 'react'
import Tooltip from './Tooltip.jsx'

function healthColor(h) {
  if (h === 'NOMINAL')  return 'var(--green)'
  if (h === 'DEGRADED') return 'var(--amber)'
  if (h === 'UNKNOWN')  return 'var(--grey)'
  return 'var(--red)'
}

function participationColor(pct) {
  if (pct == null) return 'var(--grey)'
  if (pct >= 95) return 'var(--green)'
  if (pct >= 75) return 'var(--amber)'
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

  const p            = summary?.participation
  const blockNumber  = summary?.blockNumber ?? '—'
  const syncHealth   = summary?.syncHealth  ?? '—'

  return (
    <div className="grid-4 section">
      <div className="tile">
        <div className="tile-label">ATTESTATION PARTICIPATION <Tooltip text="% of this slot's expected attesting validators whose attestations were included on-chain, measured directly from attestation aggregation bitfields. The Fast Confirmation Rule requires ≥75% of stake honest and attesting." /></div>
        <div className="tile-value" style={{ color: participationColor(p?.pct) }}>{p?.pct != null ? `${p.pct}%` : '—'}</div>
        <div className="tile-sub">{p ? `${p.attesting.toLocaleString()} / ${p.committeeMembers.toLocaleString()} attesters · slot ${p.refSlot.toLocaleString()}` : '—'}</div>
      </div>

      <div className="tile">
        <div className="tile-label">HEAD BLOCK <Tooltip text="Execution-layer block number at the current beacon head. Once clients ship FCR, a block like this would be confirmable ~13s after proposal via the 'safe' block tag." /></div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>#{blockNumber.toLocaleString?.() ?? blockNumber}</div>
        <div className="tile-sub">slot {summary?.slot?.toLocaleString() ?? '—'}</div>
      </div>

      <div className="tile">
        <div className="tile-label">SLOT AGE <Tooltip text="Seconds since the current beacon slot began. Slots are exactly 12 seconds. Age >12s means you are seeing the previous slot's data while waiting for the next block." align="right" /></div>
        <div className="tile-value" style={{ color: slotAge > 20 ? 'var(--amber)' : 'var(--green)' }}>+{slotAge}s</div>
        <div className="tile-sub">since last confirmed slot</div>
      </div>

      <div className="tile">
        <div className="tile-label">SYNC HEALTH <Tooltip text={"NOMINAL — participation ≥95%, FCR assumption comfortably met\nDEGRADED — participation 75–95%, fast confirmation possible but may be delayed by slots\nBELOW_FCR — participation <75%, the FCR threshold cannot be met; the chain still finalizes normally after ~2 epochs (~13 min)"} align="right" /></div>
        <div className="tile-value" style={{ fontSize: '1.2rem', color: healthColor(syncHealth) }}>{syncHealth}</div>
        <div className="tile-sub">participation {p?.windowPct ?? '—'}% (last {p?.windowSlots ?? '—'} slots)</div>
      </div>
    </div>
  )
}
