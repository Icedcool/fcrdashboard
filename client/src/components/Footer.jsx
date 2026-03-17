import { useState, useEffect } from 'react'

export default function Footer({ lastUpdated, refreshInterval = 12 }) {
  const [countdown, setCountdown] = useState(refreshInterval)

  useEffect(() => {
    if (!lastUpdated) return
    setCountdown(refreshInterval)
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) return refreshInterval
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [lastUpdated, refreshInterval])

  const isoTs = lastUpdated ? lastUpdated.toISOString() : '—'

  return (
    <footer className="footer">
      <span>
        DATA:&nbsp;
        <a href="https://ethereum.github.io/beacon-APIs/" target="_blank" rel="noopener">Beacon API</a>
        &nbsp;+&nbsp;
        <a href="https://rated.network" target="_blank" rel="noopener">Rated.network</a>
        &nbsp;+&nbsp;
        <a href="https://ethpandaops.io/xatu" target="_blank" rel="noopener">ethPandaOps</a>
      </span>
      <span>
        SPEC:&nbsp;
        <a href="https://github.com/ethereum/consensus-specs/pull/4747" target="_blank" rel="noopener">consensus-specs#4747</a>
        &nbsp;|&nbsp;
        <a href="https://fastconfirm.it/" target="_blank" rel="noopener">fastconfirm.it</a>
      </span>
      <span style={{ color: 'var(--grey)' }}>
        UPDATED: {isoTs}&nbsp;&nbsp;(auto-refresh: {countdown}s)
      </span>
    </footer>
  )
}
