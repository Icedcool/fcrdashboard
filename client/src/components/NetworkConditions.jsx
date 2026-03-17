import Tooltip from './Tooltip.jsx'

function healthColor(h) {
  if (h === 'NOMINAL')  return 'var(--green)'
  if (h === 'DEGRADED') return 'var(--amber)'
  return 'var(--red)'
}

export default function NetworkConditions({ network }) {
  const n = network ?? {}
  const missedPct = n.totalSlots24h
    ? ((n.missedSlots24h / n.totalSlots24h) * 100).toFixed(2)
    : '0.00'

  const rows = [
    { key: 'PARTICIPATION RATE (7d avg)', tip: '7-day average of validators that submitted valid attestations per slot. A healthy network sustains ≥95%. Below 75% disables FCR.',                                        val: `${n.participationRate7d ?? '—'}%`, color: null },
    { key: 'SYNC COMMITTEE HEALTH',       tip: 'Status of the 512-member sync committee that co-signs the chain head for light clients. NOMINAL = all members online and signing.',                                     val: n.syncCommitteeHealth ?? '—',       color: healthColor(n.syncCommitteeHealth) },
    { key: 'MISSED SLOTS (24h)',          tip: 'Slots in the last 24 hours with no block produced (~7200 slots/day). A missed slot means the assigned proposer was offline or too slow. <0.1% is normal.',             val: `${n.missedSlots24h ?? '—'} / ${n.totalSlots24h ?? '—'} (${missedPct}%)`, color: null },
    { key: 'REORG COUNT (24h)',           tip: 'Chain reorganizations in the last 24 hours. A reorg happens when a competing fork temporarily wins. Any reorg deeper than 1 slot is unusual on a healthy network.',    val: `${n.reorgCount24h ?? '—'}`,        color: (n.reorgCount24h > 0) ? 'var(--amber)' : null },
    { key: 'CURRENT BASE REWARD',         tip: 'Per-validator issuance reward per epoch for correct attestations. Scales inversely with total validator count — more validators = smaller individual reward.',          val: n.baseReward ?? '—',                color: null },
    { key: 'NETWORK LATENCY HEALTH',      tip: 'Derived from block propagation timing. NOMINAL = blocks reach >95% of nodes before the attestation deadline. DEGRADED = late blocks increasing missed attestations.',  val: n.latencyHealth ?? '—',             color: healthColor(n.latencyHealth) },
  ]

  return (
    <div className="section border-box">
      <div className="section-header">NETWORK CONDITIONS</div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: '6px' }}>
          {'─'.repeat(50)}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td style={{ color: 'var(--green-dim)', paddingBottom: '4px', paddingRight: '16px', whiteSpace: 'nowrap' }}>
                  {r.key}: <Tooltip text={r.tip} />
                </td>
                <td style={{ color: r.color || 'var(--green)', paddingBottom: '4px' }}>
                  {r.val}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
