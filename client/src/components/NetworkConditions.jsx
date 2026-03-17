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
    { key: 'PARTICIPATION RATE (7d avg)', val: `${n.participationRate7d ?? '—'}%`, color: null },
    { key: 'SYNC COMMITTEE HEALTH',       val: n.syncCommitteeHealth ?? '—',       color: healthColor(n.syncCommitteeHealth) },
    { key: 'MISSED SLOTS (24h)',          val: `${n.missedSlots24h ?? '—'} / ${n.totalSlots24h ?? '—'} (${missedPct}%)`, color: null },
    { key: 'REORG COUNT (24h)',           val: `${n.reorgCount24h ?? '—'}`,        color: (n.reorgCount24h > 0) ? 'var(--amber)' : null },
    { key: 'CURRENT BASE REWARD',         val: n.baseReward ?? '—',                color: null },
    { key: 'NETWORK LATENCY HEALTH',      val: n.latencyHealth ?? '—',             color: healthColor(n.latencyHealth) },
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
                  {r.key}:
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
