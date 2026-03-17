import { useState, useEffect, useRef } from 'react'
import { usePolling } from './hooks/usePolling.js'
import Header from './components/Header.jsx'
import HeroMetrics from './components/HeroMetrics.jsx'
import LiveConfirmation from './components/LiveConfirmation.jsx'
import ClientTable from './components/ClientTable.jsx'
import AdoptionChart from './components/AdoptionChart.jsx'
import SlotStream from './components/SlotStream.jsx'
import NetworkConditions from './components/NetworkConditions.jsx'
import FcrExplainer from './components/FcrExplainer.jsx'
import Footer from './components/Footer.jsx'

const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']

function useSpinner(active) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER_FRAMES.length), 80)
    return () => clearInterval(t)
  }, [active])
  return SPINNER_FRAMES[frame]
}

export default function App() {
  const [crtOn, setCrtOn]           = useState(false)
  const [theme, setTheme]           = useState(() =>
    localStorage.getItem('fcrTheme') || 'fastconfirm'
  )
  const [showExplainer, setShowExplainer] = useState(() => {
    try { return !localStorage.getItem('fcrExplainerDismissed') } catch { return true }
  })
  const exportRef = useRef(null)

  const { data: summary,  loading: l1, lastUpdated, refresh }  = usePolling('/api/v1/summary', 12000)
  const { data: slots,    loading: l2 }                         = usePolling('/api/v1/slots?limit=50', 12000)
  const { data: history,  loading: l3 }                         = usePolling('/api/v1/adoption/history', 60000)

  const loading = l1 || l2 || l3
  const spinner = useSpinner(loading)

  // CRT toggle
  useEffect(() => {
    document.body.classList.toggle('crt', crtOn)
  }, [crtOn])

  // Theme toggle
  useEffect(() => {
    document.body.classList.toggle('theme-fc', theme === 'fastconfirm')
    localStorage.setItem('fcrTheme', theme)
  }, [theme])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'r' || e.key === 'R') refresh()
      if (e.key === 'e' || e.key === 'E') exportRef.current?.()
      if (e.key === 'c' || e.key === 'C') setCrtOn(v => !v)
      if (e.key === '?')                  setShowExplainer(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refresh])

  function dismissExplainer() {
    setShowExplainer(false)
    try { localStorage.setItem('fcrExplainerDismissed', '1') } catch {}
  }

  return (
    <>
      <div className="dev-banner">
        [ β ] IN DEVELOPMENT — data is experimental and may be inaccurate
      </div>

      {showExplainer && <FcrExplainer onClose={dismissExplainer} />}

      <div style={{ padding: '0 0 4px' }}>
        <Header
          summary={summary}
          crtOn={crtOn}
          onCrtToggle={() => setCrtOn(v => !v)}
          onHelp={() => setShowExplainer(true)}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'terminal' ? 'fastconfirm' : 'terminal')}
        />

        {loading && !summary && (
          <div className="loading-msg">
            {spinner} initializing...
          </div>
        )}

        {loading && summary && (
          <div style={{ fontSize: '0.72rem', color: 'var(--green-dim)', marginBottom: '6px' }}>
            {spinner} refreshing...
          </div>
        )}

        <HeroMetrics summary={summary} />

        <LiveConfirmation summary={summary} />

        <div className="grid-2 section">
          <ClientTable clients={summary?.clients ?? []} />
          <NetworkConditions network={summary?.network} />
        </div>

        <AdoptionChart history={history ?? []} />

        <SlotStream slots={slots ?? []} onExportRef={exportRef} />

        <Footer lastUpdated={lastUpdated} refreshInterval={12} />
      </div>

      <div className="shortcut-bar">
        <span><span className="key">[R]</span> REFRESH</span>
        <span><span className="key">[E]</span> EXPORT</span>
        <span><span className="key">[?]</span> HELP</span>
        <span><span className="key">[C]</span> CRT</span>
        {loading && <span style={{ marginLeft: 'auto', color: 'var(--green-dim)' }}>{spinner}</span>}
      </div>
    </>
  )
}
