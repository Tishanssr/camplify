import { useEffect, useRef } from 'react'

export function useSSE(isLoggedIn, onEvent) {
  const eventSourceRef = useRef(null)

  useEffect(() => {
    if (!isLoggedIn) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    // Connect to SSE stream
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    const sseUrl = `${backendUrl}/api/sse/stream`

    // EventSource with credentials
    const es = new EventSource(sseUrl, { withCredentials: true })
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('[SSE] Connected to real-time notification stream')
    }

    es.addEventListener('trip_update', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (onEvent) onEvent('trip_update', data)
      } catch (err) {
        console.error('[SSE] Error parsing trip_update event:', err)
      }
    })

    es.addEventListener('checklist_update', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (onEvent) onEvent('checklist_update', data)
      } catch (err) {
        console.error('[SSE] Error parsing checklist_update event:', err)
      }
    })

    es.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse(e.data)
        console.log('[SSE] Handshake complete:', data)
      } catch (err) {
        console.error('[SSE] Error parsing connected handshake:', err)
      }
    })

    es.onerror = (err) => {
      console.warn('[SSE] EventSource connection error or retry:', err)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isLoggedIn, onEvent])
}
