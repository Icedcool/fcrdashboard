const BASE = process.env.BEACON_API_URL || 'https://ethereum-beacon-api.publicnode.com'

export async function beaconGet(path) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal })
    if (!res.ok) throw new Error(`Beacon ${path}: HTTP ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(t)
  }
}
