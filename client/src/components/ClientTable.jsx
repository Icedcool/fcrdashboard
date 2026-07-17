import { useState } from 'react'
import Tooltip from './Tooltip.jsx'

const COLS = [
  { key: 'name',         label: 'CLIENT',          tip: null },
  { key: 'fcrStage',     label: 'FCR STAGE',       tip: 'Implementation progress per client team (FCR breakout call #6, Apr 2026; spec merged Apr 16 2026 — consensus-specs#4747). No client has FCR in a production release yet.' },
  { key: 'stageNote',    label: 'DETAIL',          tip: null },
  { key: 'sampleBlocks', label: 'BLOCKS (SAMPLE)', tip: 'Blocks proposed by this client among the recently sampled blocks, identified by proposer graffiti. Most proposers set no identifying graffiti — this is a lower-bound sample, not a validator-share measurement.' },
  { key: 'samplePct',    label: 'SAMPLE %',        tip: 'Share of the sampled blocks attributed to this client via graffiti.' },
]

function stageColor(s) {
  if (s === 'STAGING')                 return 'var(--green)'
  if (s === 'POC' || s === 'IN_DEV')   return 'var(--amber)'
  return 'var(--grey)'
}

export default function ClientTable({ clients = [], adoption, totalValidators, statusAsOf }) {
  const [sortKey, setSortKey]   = useState('sampleBlocks')
  const [sortDir, setSortDir]   = useState(-1)  // -1 = desc

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  const sorted = [...clients].sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir
    if (av > bv) return -sortDir
    return 0
  })

  return (
    <div className="section border-box">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>CLIENT FCR IMPLEMENTATION STATUS</span>
        {statusAsOf && <span style={{ color: 'var(--grey)', fontSize: '0.68rem', fontWeight: 400 }}>as of {statusAsOf}</span>}
      </div>
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
                  {col.label}{col.tip && <Tooltip text={col.tip} />}
                  <span className="sort-arrow">
                    {sortKey === col.key ? (sortDir === -1 ? '↓' : '↑') : '↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: '0 10px', color: 'var(--grey)', fontSize: '0.72rem' }}>
                {'─'.repeat(80)}
              </td>
            </tr>
            {sorted.map(c => (
              <tr key={c.name}>
                <td style={{ color: c.name === 'UNKNOWN' ? 'var(--grey)' : 'var(--green)' }}>{c.name}</td>
                <td style={{ color: stageColor(c.fcrStage) }}>{c.fcrStage ?? '—'}</td>
                <td style={{ color: 'var(--grey)', fontSize: '0.75rem' }}>{c.stageNote}</td>
                <td>{c.sampleBlocks}</td>
                <td>{c.samplePct}%</td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{ padding: '0 10px', color: 'var(--grey)', fontSize: '0.72rem' }}>
                {'─'.repeat(80)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ color: 'var(--green-dim)' }}>IDENTIFIED / SAMPLED <Tooltip text="Blocks whose proposer graffiti named a known consensus client, out of all blocks sampled this refresh." /></td>
              <td>{adoption ? `${adoption.identified} / ${adoption.sampleSize}` : '—'}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3} style={{ color: 'var(--grey)' }}>ACTIVE VALIDATORS (EST) <Tooltip text="Estimated from attestation committee sizes: one slot's committee seats × 32 slots per epoch." /></td>
              <td>{totalValidators?.toLocaleString() ?? '—'}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
