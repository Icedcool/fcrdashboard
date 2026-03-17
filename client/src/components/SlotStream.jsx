import { useEffect, useRef } from 'react'

function slotColor(status) {
  if (status === 'FAST_CONFIRMED') return 'var(--green)'
  if (status === 'MISSED')         return 'var(--amber)'
  return 'var(--grey)'
}

function formatAge(ms) {
  const s = (ms / 1000).toFixed(1)
  return `${s}s`
}

function exportCsv(slots) {
  const header = 'slot,status,attestPct,ageMs,proposer,ts\n'
  const rows = slots.map(s =>
    `${s.slot},${s.status},${s.attestPct ?? ''},${s.ageMs},${s.proposer ?? ''},${s.ts}`
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fcr-slots-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SlotStream({ slots = [], onExportRef }) {
  // expose export fn to parent
  useEffect(() => {
    if (onExportRef) onExportRef.current = () => exportCsv(slots)
  }, [slots, onExportRef])

  return (
    <div className="section border-box">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>SLOT STREAM</span>
        <button className="btn" style={{ fontSize: '0.7rem' }} onClick={() => exportCsv(slots)}>[EXPORT CSV]</button>
      </div>
      <div className="slot-stream">
        {slots.length === 0 && (
          <div style={{ color: 'var(--grey)' }}>waiting for data...</div>
        )}
        {slots.map((s, i) => (
          <div key={`${s.slot}-${i}`} className="slot-entry" style={{ color: slotColor(s.status) }}>
            {'> '}
            <span style={{ color: 'var(--grey)' }}>[{s.slot}]</span>
            {' '}
            <span style={{ color: slotColor(s.status) }}>{s.status.padEnd(16)}</span>
            {s.attestPct != null && (
              <span style={{ color: 'var(--grey)' }}>{` | attest: ${s.attestPct}%`}</span>
            )}
            {s.ageMs != null && (
              <span style={{ color: 'var(--grey)' }}>{` | age: ${formatAge(s.ageMs)}`}</span>
            )}
            {s.proposer && (
              <span style={{ color: 'var(--green-dim)' }}>{` | ${s.proposer}`}</span>
            )}
            {s.status === 'MISSED' && (
              <span style={{ color: 'var(--grey)' }}> | proposer offline</span>
            )}
            {s.status === 'FINALIZED' && (
              <span style={{ color: 'var(--grey)' }}> | threshold not met</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
