import Tooltip from './Tooltip.jsx'

function GaugeBar({ pct }) {
  // Color zones: 0-50% red, 50-75% amber, 75-100% green
  let fillColor = 'var(--red)'
  if (pct >= 75) fillColor = 'var(--green)'
  else if (pct >= 50) fillColor = 'var(--amber)'

  // threshold at 75% = 150px from bottom in a 200px track
  const thresholdBottom = 200 * 0.75

  return (
    <div className="gauge-wrap">
      <div style={{ fontSize: '0.72rem', color: 'var(--green-dim)' }}>ATTESTING STAKE <Tooltip text="Measured % of expected attesters included on-chain — the observable proxy for the FCR's ≥75% honest-and-attesting stake assumption (<25% adversarial). Below the line, fast confirmation is impossible and the chain relies on ~13 min finality." align="right" /></div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: fillColor }}>{pct?.toFixed(1)}%</div>
      <div style={{ position: 'relative' }}>
        <div className="gauge-track">
          <div className="gauge-fill" style={{ height: `${pct}%`, background: fillColor, opacity: 0.8 }} />
          <div className="gauge-threshold" style={{ bottom: `${thresholdBottom}px` }} />
        </div>
        <div style={{
          position: 'absolute',
          right: '-36px',
          bottom: `${thresholdBottom}px`,
          fontSize: '0.65rem',
          color: 'var(--green-dim)',
          transform: 'translateY(50%)',
          whiteSpace: 'nowrap',
        }}>75%</div>
      </div>
      <div className="gauge-label">
        <div style={{ color: 'var(--green-dim)', fontSize: '0.65rem', marginTop: '4px' }}>── FCR threshold</div>
      </div>
    </div>
  )
}

export default function LiveConfirmation({ summary }) {
  const s = summary
  const p = s?.participation
  const thresholdMet = s?.thresholdMet

  const statusColor = thresholdMet ? 'var(--green)' : 'var(--amber)'
  const statusLabel = thresholdMet == null ? '—' : thresholdMet ? 'THRESHOLD_MET ✓' : 'BELOW_THRESHOLD'

  return (
    <div className="section border-box" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
      <div style={{ borderRight: '1px solid var(--green-dim)' }}>
        <div className="section-header">LIVE CONFIRMATION STATUS</div>
        <div className="kv-list">
          <div><span className="kv-key">SLOT: <Tooltip text="Current beacon chain slot number. One slot every 12 seconds, 32 slots per epoch." /></span><span className="kv-val">{s?.slot?.toLocaleString() ?? '—'}</span></div>
          <div><span className="kv-key">BLOCK: <Tooltip text="Execution layer block hash and number included in this beacon slot's payload. Under FCR, this is the kind of block the 'safe' tag would return once fast-confirmed." /></span><span className="kv-val" style={{ color: 'var(--cyan)' }}>{s?.blockHash ?? '—'}{s?.blockNumber ? ` (#${s.blockNumber.toLocaleString()})` : ''}</span></div>
          <div><span className="kv-key">STATUS: <Tooltip text="Whether measured participation meets the ≥75% threshold the FCR requires. Note: no consensus client has FCR enabled in production yet — this shows whether the network currently satisfies the rule's participation assumption." /></span><span className="kv-val" style={{ color: statusColor }}>{statusLabel}</span></div>
          <div><span className="kv-key">CONFIRMATION TARGET: <Tooltip text="Theoretical FCR time-to-confirmation: one 12s slot plus propagation ≈13s, vs ~13 minutes for 2-epoch finality. An adversary >5% of stake can delay confirmation (15% → +1 slot, 18% → +2, 20% → +3)." /></span><span className="kv-val">~13s (1 slot) vs ~13 min finality</span></div>
          <div>
            <span className="kv-key">ATTESTATIONS: <Tooltip text="Attesting validators vs expected committee seats for the measured slot (head−1), read from on-chain aggregation bitfields." /></span>
            <span className="kv-val">
              {p ? (
                <>
                  {p.attesting.toLocaleString()} / {p.committeeMembers.toLocaleString()}&nbsp;
                  <span style={{ color: 'var(--grey)' }}>({p.pct}%)</span>
                </>
              ) : '—'}
            </span>
          </div>
          <div>
            <span className="kv-key">THRESHOLD MET: <Tooltip text="YES when ≥75% of expected attesters for the measured slot are on-chain — the FCR's participation assumption. Independent of which clients proposers run." /></span>
            <span className="kv-val" style={{ color: thresholdMet ? 'var(--green)' : 'var(--amber)' }}>
              {thresholdMet == null ? '—' : thresholdMet ? 'YES' : 'NO'}
              {thresholdMet === false && <span style={{ color: 'var(--grey)' }}>&nbsp;&nbsp;[needs ≥75%]</span>}
            </span>
          </div>
        </div>
      </div>
      <GaugeBar pct={p?.pct ?? 0} />
    </div>
  )
}
