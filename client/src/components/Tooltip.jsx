import { useState } from 'react'

export default function Tooltip({ text, align = 'left' }) {
  const [visible, setVisible] = useState(false)

  const boxStyle = {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    zIndex: 200,
    background: '#0a0a0a',
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
      style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="tooltip-trigger">[?]</span>
      {visible && <div style={boxStyle}>{text}</div>}
    </span>
  )
}
