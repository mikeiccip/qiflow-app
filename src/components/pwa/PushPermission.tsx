'use client'

import { useEffect, useState } from 'react'

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied' | 'loading'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export function PushPermission() {
  const [status, setStatus] = useState<PermissionState>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission as PermissionState)
  }, [])

  async function subscribe() {
    setBusy(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('VAPID key not configured')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const sub = subscription.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
        }),
      })

      setStatus('granted')
    } catch (err) {
      setError('Could not enable notifications. Please try again.')
      console.error('[push] subscribe error:', err)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setStatus('default')
    } catch (err) {
      setError('Could not disable notifications. Please try again.')
      console.error('[push] unsubscribe error:', err)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return null
  if (status === 'unsupported') return null

  return (
    <div className="space-y-2" role="region" aria-label="Notification settings">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Daily reminders</p>
          <p className="text-xs text-text-secondary">
            {status === 'granted'
              ? 'Push notifications enabled'
              : status === 'denied'
              ? 'Blocked — enable in browser settings'
              : 'Get reminded to log your daily check-in'}
          </p>
        </div>

        {status === 'granted' ? (
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:border-error hover:text-error transition-colors duration-200 disabled:opacity-50"
            aria-label="Disable push notifications"
          >
            {busy ? '…' : 'Disable'}
          </button>
        ) : status === 'denied' ? (
          <span className="text-xs text-error" aria-live="polite">Blocked</span>
        ) : (
          <button
            onClick={subscribe}
            disabled={busy}
            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
            aria-label="Enable push notifications"
          >
            {busy ? '…' : 'Enable'}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}
