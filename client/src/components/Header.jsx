import { useState, useEffect } from 'react'

export default function Header({ summary, crtOn, onCrtToggle, onHelp, theme, onThemeToggle }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const slot  = summary?.slot  ?? '...'
  const epoch = summary?.epoch ?? '...'

  return (
    <header style={{ borderBottom: '1px solid var(--green-dim)', padding: '8px 0 6px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--green)' }}>
          FCR DASHBOARD
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--green-dim)', letterSpacing: '0.06em' }}>
          MAINNET&nbsp;|&nbsp;SLOT:&nbsp;
          <span style={{ color: 'var(--green)' }}>{slot}</span>
          &nbsp;|&nbsp;EPOCH:&nbsp;
          <span style={{ color: 'var(--green)' }}>{epoch}</span>
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--green-dim)' }}>
          &gt; fast confirmation rule :: validator adoption monitor
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={`btn ${crtOn ? 'active' : ''} crt-btn`} onClick={onCrtToggle}>
            [CRT: {crtOn ? 'ON' : 'OFF'}]
          </button>
          <button className="btn" onClick={onThemeToggle}>
            [THEME: {theme === 'fastconfirm' ? 'FCR' : 'TERMINAL'}]
          </button>
          <button className="btn" onClick={onHelp}>[?]</button>
        </div>
      </div>
    </header>
  )
}
