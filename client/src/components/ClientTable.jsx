import { useState } from 'react'

const COLS = [
  { key: 'name',       label: 'CLIENT'      },
  { key: 'version',    label: 'VERSION'     },
  { key: 'fcrEnabled', label: 'FCR SUPPORT' },
  { key: 'validators', label: 'VALIDATORS'  },
  { key: 'pctOfSet',   label: '% OF SET'    },
  { key: 'status',     label: 'STATUS'      },
]

function statusColor(s) {
  if (s === 'LIVE') return 'var(--green)'
  if (s === 'DEV')  return 'var(--amber)'
  return 'var(--grey)'
}

export default function ClientTable({ clients = [] }) {
  const [sortKey, setSortKey]   = useState('validators')
  const [sortDir, setSortDir]   = useState(-1)  // -1 = desc

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  const sorted = [...clients].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir
    if (av > bv) return -sortDir
    return 0
  })

  const totalValidators = clients.reduce((s, c) => s + c.validators, 0)
  const fcrValidators   = clients.filter(c => c.fcrEnabled).reduce((s, c) => s + c.validators, 0)
  const fcrPct          = totalValidators ? ((fcrValidators / totalValidators) * 100).toFixed(1) : '0.0'

  return (
    <div className="section border-box">
      <div className="section-header">CLIENT ADOPTION BREAKDOWN</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sortKey === col.key ? 'sort-active' : ''}
                >
                  {col.label}
                  <span className="sort-arrow">
                    {sortKey === col.key ? (sortDir === -1 ? '↓' : '↑') : '↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '0 10px', color: 'var(--grey)', fontSize: '0.72rem' }}>
                {'─'.repeat(80)}
              </td>
            </tr>
            {sorted.map(c => (
              <tr key={c.name}>
                <td style={{ color: 'var(--green)' }}>{c.name}</td>
                <td style={{ color: 'var(--grey)' }}>{c.version}</td>
                <td style={{ color: c.fcrEnabled ? 'var(--green)' : 'var(--grey)' }}>
                  {c.fcrEnabled ? '✓ ENABLED' : '✗ PENDING'}
                </td>
                <td>{c.validators.toLocaleString()}</td>
                <td>{c.pctOfSet}%</td>
                <td style={{ color: statusColor(c.status) }}>{c.status}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ padding: '0 10px', color: 'var(--grey)', fontSize: '0.72rem' }}>
                {'─'.repeat(80)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ color: 'var(--green-dim)' }}>FCR-ENABLED TOTAL</td>
              <td></td>
              <td>{fcrValidators.toLocaleString()}</td>
              <td>{fcrPct}%</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={2} style={{ color: 'var(--grey)' }}>ACTIVE VALIDATOR SET</td>
              <td></td>
              <td>{totalValidators.toLocaleString()}</td>
              <td>100.0%</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
