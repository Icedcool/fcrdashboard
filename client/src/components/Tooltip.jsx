import { useState, useRef } from 'react'

export default function Tooltip({ text, align = 'left' }) {
  const [visible, setVisible] = useState(false)
  const [above, setAbove] = useState(true)
  const ref = useRef(null)

  function handleEnter() {
    if (ref.current) {
      setAbove(ref.current.getBoundingClientRect().top >= 150)
    }
    setVisible(true)
  }

  const boxStyle = {
    position: 'absolute',
    ...(above
      ? { bottom: 'calc(100% + 6px)' }
      : { top:    'calc(100% + 6px)' }),
    zIndex: 200,
    background: 'var(--bg-panel)',
    border: '1px solid var(--green-dim)',
    padding: '8px 10px',
    fontSize: '0.72rem',
    color: 'var(--green-dim)',
    maxWidth: '260px',
    width: 'max-content',
    whiteSpace: 'normal',
    lineHeight: 1.6,
    pointerEvents: 'none',
    ...(align === 'right' ? { right: 0 } : { left: 0 }),
  }

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="tooltip-trigger">[?]</span>
      {visible && <div style={boxStyle}>{text}</div>}
    </span>
  )
}
