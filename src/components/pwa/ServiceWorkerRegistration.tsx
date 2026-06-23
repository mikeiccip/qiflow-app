'use client'

import { useEffect } from 'react'
import { drainQueue } from '@/lib/offline/checkinQueue'

async function submitCheckin(payload: {
  checkin_date: string
  pain: number
  energy: number
  sleep: number
  mood: string
  note: string | null
}): Promise<boolean> {
  try {
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Listen for messages from the SW (e.g. background-sync trigger)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'DRAIN_CHECKIN_QUEUE') {
            drainQueue(submitCheckin).catch(() => {})
          }
        })

        // Also drain on connection restore (belt-and-suspenders with SW sync)
        window.addEventListener('online', () => {
          drainQueue(submitCheckin).catch(() => {})

          // Re-register background sync if supported
          if ('sync' in registration) {
            registration.sync.register('checkin-sync').catch(() => {})
          }
        })
      })
      .catch((err) => {
        console.warn('[SW] registration failed:', err)
      })
  }, [])

  return null
}
