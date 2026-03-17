const XATU = 'https://clickhouse.xatu.ethpandaops.io'

export async function xatuQuery(sql) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(
      `${XATU}/?query=${encodeURIComponent(sql + ' FORMAT JSONEachRow')}`,
      {
        headers: { 'X-ClickHouse-User': 'default', 'X-ClickHouse-Password': '' },
        signal: controller.signal,
      }
    )
    if (!res.ok) throw new Error(`Xatu: HTTP ${res.status}`)
    const text = await res.text()
    return text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  } finally {
    clearTimeout(t)
  }
}
