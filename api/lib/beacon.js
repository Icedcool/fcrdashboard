const BASE = process.env.BEACON_API_URL || 'https://ethereum-beacon-api.publicnode.com'

export class BeaconHttpError extends Error {
  constructor(path, status) {
    super(`Beacon ${path}: HTTP ${status}`)
    this.status = status
  }
}

export async function beaconGet(path) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new BeaconHttpError(path, res.status)
    return res.json()
  } finally {
    clearTimeout(t)
  }
}

// A 404 for a block means the slot was genuinely missed (no block proposed);
// anything else is an RPC/network failure and must not be counted as missed.
export async function fetchBlock(slot) {
  try {
    return { slot, block: await beaconGet(`/eth/v2/beacon/blocks/${slot}`) }
  } catch (e) {
    if (e instanceof BeaconHttpError && e.status === 404) return { slot, missed: true }
    return { slot, error: true }
  }
}

export async function fetchFinality() {
  const d = await beaconGet('/eth/v1/beacon/states/head/finality_checkpoints')
  return {
    justifiedEpoch: parseInt(d.data.current_justified.epoch),
    finalizedEpoch: parseInt(d.data.finalized.epoch),
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
  if (/[Gg]randine/.test(text)) return 'Grandine'
  return null
}

export const GENESIS_TIME_MS = 1606824023000  // Beacon chain genesis (Dec 1, 2020)
