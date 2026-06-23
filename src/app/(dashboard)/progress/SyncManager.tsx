'use client'

import { useEffect } from 'react'
import { drainQueue } from '@/lib/offline/checkinQueue'
import { toast } from '@/components/ui'

async function syncPending() {
  try {
    const { synced } = await drainQueue(async (payload) => {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return res.ok
    })
    if (synced > 0) {
      toast.success(`Synced ${synced} offline check-in${synced > 1 ? 's' : ''}`)
    }
  } catch {
    // Silently fail — will retry on next online event
  }
}

export function SyncManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Attempt sync on mount (may have been offline before)
    if (navigator.onLine) {
      syncPending()
    }

    const handleOnline = () => {
      syncPending()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return null
}
