function GaugeBar({ pct }) {
  // Color zones: 0-50% red, 50-75% amber, 75-100% green
  let fillColor = 'var(--red)'
  if (pct >= 75) fillColor = 'var(--green)'
  else if (pct >= 50) fillColor = 'var(--amber)'

  // threshold at 75% = 150px from bottom in a 200px track
  const thresholdBottom = 200 * 0.75

  return (
    <div className="gauge-wrap">
      <div style={{ fontSize: '0.72rem', color: 'var(--green-dim)' }}>HONEST STAKE</div>
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
  const thresholdMet = s?.thresholdMet
  const confirmSec = s?.confirmationMs ? (s.confirmationMs / 1000).toFixed(1) : '—'
  const attestTotal = s?.totalValidators ?? 0
  const attestActive = s ? Math.round(attestTotal * s.attestationPct / 100) : 0

  const statusColor = thresholdMet ? 'var(--green)' : 'var(--amber)'
  const statusLabel = thresholdMet ? 'FAST_CONFIRMED ✓' : 'THRESHOLD_NOT_MET'

  return (
    <div className="section border-box" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
      <div style={{ borderRight: '1px solid var(--green-dim)' }}>
        <div className="section-header">LIVE CONFIRMATION STATUS</div>
        <div className="kv-list">
          <div><span className="kv-key">SLOT:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="kv-val">{s?.slot?.toLocaleString() ?? '—'}</span></div>
          <div><span className="kv-key">BLOCK:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="kv-val" style={{ color: 'var(--cyan)' }}>{s?.blockHash ?? '—'}</span></div>
          <div><span className="kv-key">STATUS:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="kv-val" style={{ color: statusColor }}>{statusLabel}</span></div>
          <div><span className="kv-key">CONFIRMATION:&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="kv-val">{confirmSec}s</span></div>
          <div>
            <span className="kv-key">ATTESTATIONS:&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span className="kv-val">
              {attestActive.toLocaleString()} / {attestTotal.toLocaleString()}&nbsp;
              <span style={{ color: 'var(--grey)' }}>({s?.attestationPct ?? '—'}%)</span>
            </span>
          </div>
          <div>
            <span className="kv-key">THRESHOLD MET:&nbsp;&nbsp;&nbsp;</span>
            <span className="kv-val" style={{ color: thresholdMet ? 'var(--green)' : 'var(--amber)' }}>
              {thresholdMet == null ? '—' : thresholdMet ? 'YES' : 'NO'}
              {!thresholdMet && <span style={{ color: 'var(--grey)' }}>&nbsp;&nbsp;[needs ≥75%]</span>}
            </span>
          </div>
        </div>
      </div>
      <GaugeBar pct={s?.attestationPct ?? 0} />
    </div>
  )
}
