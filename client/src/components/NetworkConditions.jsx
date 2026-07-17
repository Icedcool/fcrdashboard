import Tooltip from './Tooltip.jsx'

function participationColor(pct) {
  if (pct == null) return null
  if (pct >= 95) return 'var(--green)'
  if (pct >= 75) return 'var(--amber)'
  return 'var(--red)'
}

export default function NetworkConditions({ network, finality, totalValidators }) {
  const n = network ?? {}
  const missedPct = n.sampledSlots
    ? ((n.missedSlots / n.sampledSlots) * 100).toFixed(1)
    : null

  const rows = [
    {
      key: `PARTICIPATION (last ${n.windowSlots ?? '—'} slots)`,
      tip: 'Average attestation participation over the sampled slot window, measured from on-chain aggregation bitfields. Healthy mainnet sustains ≥95%; below 75% the FCR cannot confirm.',
      val: n.participationPct != null ? `${n.participationPct}%` : '—',
      color: participationColor(n.participationPct),
    },
    {
      key: 'MISSED SLOTS (window)',
      tip: 'Slots in the sampled window with no block produced (beacon node returned 404) — proposer offline or too slow. RPC errors are counted separately and excluded.',
      val: n.missedSlots != null
        ? `${n.missedSlots} / ${n.sampledSlots} (${missedPct}%)${n.fetchErrors > 0 ? ` · ${n.fetchErrors} rpc errors` : ''}`
        : '—',
      color: n.missedSlots > 0 ? 'var(--amber)' : null,
    },
    {
      key: 'FINALIZED EPOCH',
      tip: "Latest finalized epoch from the beacon node's finality checkpoints. Finality trails the head by ~2 epochs (~13 min) — the delay FCR shortcuts.",
      val: finality ? `${finality.finalizedEpoch.toLocaleString()} (${finality.finalizedSlotsBack} slots back)` : '—',
      color: null,
    },
    {
      key: 'JUSTIFIED EPOCH',
      tip: 'Latest justified checkpoint (one step before finalization in Casper FFG).',
      val: finality ? finality.justifiedEpoch.toLocaleString() : '—',
      color: null,
    },
    {
      key: 'ACTIVE VALIDATORS (EST)',
      tip: "Estimated from attestation committee sizes: one slot's committee seats × 32 slots per epoch.",
      val: totalValidators != null ? totalValidators.toLocaleString() : '—',
      color: null,
    },
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
