import { useState, useEffect, useRef, useCallback } from 'react'
import { getMockSummary, getMockSlots, getMockHistory } from '../data/mock.js'

const USE_MOCK = false

const MOCK_HANDLERS = {
  '/api/v1/summary':          () => getMockSummary(),
  '/api/v1/slots':            (url) => {
    const limit = new URL(url, 'http://x').searchParams.get('limit') || 50
    return getMockSlots(Number(limit))
  },
  '/api/v1/adoption/history': () => getMockHistory(),
}

export function usePolling(url, interval = 12000) {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      let result
      if (USE_MOCK) {
        const base = url.split('?')[0]
        const handler = MOCK_HANDLERS[base]
        if (!handler) throw new Error(`No mock handler for ${url}`)
        result = handler(url)
      } else {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        result = await res.json()
      }
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, interval)
    return () => clearInterval(timerRef.current)
  }, [fetchData, interval])

  const refresh = useCallback(() => {
    setLoading(true)
    clearInterval(timerRef.current)
    fetchData().then(() => {
      timerRef.current = setInterval(fetchData, interval)
    })
  }, [fetchData, interval])

  return { data, loading, error, lastUpdated, refresh }
}
