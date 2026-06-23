'use client'

import { useCallback } from 'react'

/**
 * Client-side analytics hook.
 * Calls /api/analytics — fire-and-forget via keepalive fetch.
 * Never include health data, mood values, or PII in properties.
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (event: string, properties: Record<string, unknown> = {}) => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties }),
        keepalive: true,
      }).catch(() => {})
    },
    []
  )

  return { trackEvent }
}
