const BASE = process.env.BEACON_API_URL || 'https://ethereum-beacon-api.publicnode.com'

export async function beaconGet(path) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`Beacon ${path}: HTTP ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(t)
  }
}

export function decodeGraffiti(hex) {
  if (!hex) return ''
  const buf = Buffer.from(hex.replace('0x', ''), 'hex')
  return buf.toString('utf8').replace(/\0/g, '').trim()
}

export function classifyClient(text) {
  if (!text) return null
  if (text.includes('Lodestar')) return 'Lodestar'
  if (text.includes('Lighthouse')) return 'Lighthouse'
  if (/[Pp]rysm/.test(text)) return 'Prysm'
  if (/[Tt]eku/.test(text)) return 'Teku'
  if (/[Nn]imbus/.test(text)) return 'Nimbus'
  return null
}

export const GENESIS_TIME_MS = 1606824023000  // Beacon chain genesis (Dec 1, 2020)
