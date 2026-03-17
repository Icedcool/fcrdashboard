import { useState, useMemo } from 'react'

const RANGES = ['7D', '30D', '90D', 'ALL']

const MILESTONES = [
  { label: 'Lodestar FCR', daysAgo: 60 },
  { label: 'Lighthouse FCR', daysAgo: 30 },
]

function useChartData(history, range) {
  return useMemo(() => {
    if (!history?.length) return []
    const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : history.length
    return history.slice(-days)
  }, [history, range])
}

export default function AdoptionChart({ history = [] }) {
  const [range, setRange] = useState('30D')
  const data = useChartData(history, range)

  const W = 800, H = 200
  const PAD = { top: 14, right: 20, bottom: 30, left: 42 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top  - PAD.bottom

  const maxY = 100
  const minY = 0

  function xPos(i) { return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW }
  function yPos(v) { return PAD.top  + chartH - ((v - minY) / (maxY - minY)) * chartH }

  const adoptionPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.adoptionPct).toFixed(1)}`).join(' ')
  const threshPath   = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.thresholdMetPct).toFixed(1)}`).join(' ')

  // Subtle area fill
  const areaPath = data.length
    ? `${adoptionPath} L${xPos(data.length - 1).toFixed(1)},${yPos(0).toFixed(1)} L${xPos(0).toFixed(1)},${yPos(0).toFixed(1)} Z`
    : ''

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100]

  // X-axis ticks (up to 6)
  const xTickCount = Math.min(6, data.length)
  const xTicks = xTickCount > 1
    ? Array.from({ length: xTickCount }, (_, i) => Math.round(i * (data.length - 1) / (xTickCount - 1)))
    : [0]

  // Milestones in current range
  const nowDate = new Date()
  const milestonesInRange = MILESTONES.map(m => {
    const daysAgo = m.daysAgo
    const rangeLen = data.length
    const idx = rangeLen - 1 - daysAgo
    if (idx < 0 || idx >= rangeLen) return null
    return { ...m, idx }
  }).filter(Boolean)

  return (
    <div className="section border-box">
      <div className="section-header">FCR ADOPTION OVER TIME</div>
      <div className="chart-wrap">
        <div className="chart-controls">
          {RANGES.map(r => (
            <button key={r} className={`btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              [{r}]
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--grey)' }}>
            — adoption&nbsp;&nbsp;<span style={{ color: 'var(--grey)', opacity: 0.5 }}>— threshold met %</span>
          </span>
        </div>

        {data.length === 0 ? (
          <div className="loading-msg">NO DATA</div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', maxWidth: W, display: 'block', fontFamily: 'var(--font)' }}
          >
            {/* Background grid */}
            {yTicks.map(v => (
              <line key={v}
                x1={PAD.left} y1={yPos(v).toFixed(1)}
                x2={PAD.left + chartW} y2={yPos(v).toFixed(1)}
                style={{stroke: 'var(--chart-grid)'}} strokeWidth="1"
              />
            ))}

            {/* 75% threshold line */}
            <line
              x1={PAD.left} y1={yPos(75).toFixed(1)}
              x2={PAD.left + chartW} y2={yPos(75).toFixed(1)}
              stroke="var(--green-dim)" strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={PAD.left + chartW + 3} y={yPos(75)} fill="var(--green-dim)" fontSize="9" dominantBaseline="middle">75%</text>

            {/* Milestone lines */}
            {milestonesInRange.map(m => (
              <g key={m.label}>
                <line
                  x1={xPos(m.idx).toFixed(1)} y1={PAD.top}
                  x2={xPos(m.idx).toFixed(1)} y2={PAD.top + chartH}
                  stroke="var(--grey)" strokeWidth="1" strokeDasharray="3 3"
                />
                <text
                  x={xPos(m.idx)} y={PAD.top - 3}
                  fill="var(--grey)" fontSize="8" textAnchor="middle"
                >
                  {m.label}
                </text>
              </g>
            ))}

            {/* Area fill */}
            {areaPath && <path d={areaPath} style={{fill: 'var(--chart-area)'}} />}

            {/* Threshold met % line */}
            {threshPath && (
              <path d={threshPath} fill="none" stroke="var(--grey)" strokeWidth="1" opacity="0.5" />
            )}

            {/* Adoption line */}
            {adoptionPath && (
              <path d={adoptionPath} fill="none" stroke="var(--green)" strokeWidth="1.5" />
            )}

            {/* Y axis */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="var(--green-dim)" strokeWidth="1" />
            {yTicks.map(v => (
              <g key={v}>
                <line x1={PAD.left - 4} y1={yPos(v)} x2={PAD.left} y2={yPos(v)} stroke="var(--green-dim)" strokeWidth="1" />
                <text x={PAD.left - 6} y={yPos(v)} fill="var(--grey)" fontSize="9" textAnchor="end" dominantBaseline="middle">{v}%</text>
              </g>
            ))}

            {/* X axis */}
            <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="var(--green-dim)" strokeWidth="1" />
            {xTicks.map(i => {
              if (i >= data.length) return null
              const label = data[i]?.date?.slice(5) ?? ''
              return (
                <g key={i}>
                  <line x1={xPos(i)} y1={PAD.top + chartH} x2={xPos(i)} y2={PAD.top + chartH + 4} stroke="var(--green-dim)" strokeWidth="1" />
                  <text x={xPos(i)} y={PAD.top + chartH + 12} fill="var(--grey)" fontSize="9" textAnchor="middle">{label}</text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}
