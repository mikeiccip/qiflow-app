import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)
const pub = (...parts: string[]) => resolve(__dirname, '../../public', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

function readPub(...parts: string[]) {
  return readFileSync(pub(...parts), 'utf-8')
}

// ── manifest.json ─────────────────────────────────────────────

describe('PWA manifest', () => {
  it('exists in public folder', () => {
    const content = readPub('manifest.json')
    expect(content).toBeTruthy()
  })

  it('has required PWA fields', () => {
    const manifest = JSON.parse(readPub('manifest.json'))
    expect(manifest.name).toBe('QiFlow')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/dashboard')
    expect(manifest.icons).toHaveLength(2)
  })

  it('has 192 and 512 icon sizes', () => {
    const manifest = JSON.parse(readPub('manifest.json'))
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })
})

// ── offline.html ──────────────────────────────────────────────

describe('Offline fallback page', () => {
  it('exists', () => {
    const content = readPub('offline.html')
    expect(content).toBeTruthy()
  })

  it('mentions check-ins are queued offline', () => {
    const content = readPub('offline.html')
    expect(content).toContain('queued')
    expect(content).toContain('sync')
  })

  it('has a retry button', () => {
    const content = readPub('offline.html')
    expect(content).toContain('reload')
  })

  it('has QiFlow branding', () => {
    const content = readPub('offline.html')
    expect(content).toContain('QiFlow')
  })
})

// ── Service Worker ────────────────────────────────────────────

describe('Service Worker (sw.js)', () => {
  it('exists in public folder', () => {
    const content = readPub('sw.js')
    expect(content).toBeTruthy()
  })

  it('caches offline.html and manifest in app shell', () => {
    const content = readPub('sw.js')
    expect(content).toContain('/offline.html')
    expect(content).toContain('/manifest.json')
  })

  it('skips waiting and claims clients on activate', () => {
    const content = readPub('sw.js')
    expect(content).toContain('skipWaiting')
    expect(content).toContain('clients.claim')
  })

  it('never caches /api/ routes', () => {
    const content = readPub('sw.js')
    expect(content).toContain('/api/')
  })

  it('uses cache-first strategy for _next/static assets', () => {
    const content = readPub('sw.js')
    expect(content).toContain('_next/static/')
    expect(content).toContain('caches.match')
  })

  it('serves /offline.html as navigation fallback', () => {
    const content = readPub('sw.js')
    expect(content).toContain("mode === 'navigate'")
    expect(content).toContain('/offline.html')
  })

  it('handles push events and shows notification', () => {
    const content = readPub('sw.js')
    expect(content).toContain("addEventListener('push'")
    expect(content).toContain('showNotification')
    expect(content).toContain('icon')
  })

  it('handles notificationclick and opens URL', () => {
    const content = readPub('sw.js')
    expect(content).toContain("addEventListener('notificationclick'")
    expect(content).toContain('notification.close')
    expect(content).toContain('openWindow')
  })

  it('handles background sync and notifies clients', () => {
    const content = readPub('sw.js')
    expect(content).toContain("addEventListener('sync'")
    expect(content).toContain('checkin-sync')
    expect(content).toContain('DRAIN_CHECKIN_QUEUE')
  })

  it('cleans old caches on activate', () => {
    const content = readPub('sw.js')
    expect(content).toContain('caches.keys')
    expect(content).toContain('caches.delete')
  })
})

// ── Push subscribe API ────────────────────────────────────────

describe('Push subscribe API', () => {
  it('requires auth (401 without user)', () => {
    const content = read('app/api/push/subscribe/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('validates endpoint and keys with Zod', () => {
    const content = read('app/api/push/subscribe/route.ts')
    expect(content).toContain('subscriptionSchema')
    expect(content).toContain('endpoint')
    expect(content).toContain('p256dh')
    expect(content).toContain('auth')
  })

  it('upserts to push_subscriptions with onConflict', () => {
    const content = read('app/api/push/subscribe/route.ts')
    expect(content).toContain("from('push_subscriptions')")
    expect(content).toContain('.upsert(')
    expect(content).toContain('onConflict')
    expect(content).toContain('user_id,endpoint')
  })

  it('uses service client for write', () => {
    const content = read('app/api/push/subscribe/route.ts')
    expect(content).toContain('createServiceClient')
  })

  it('returns 201 on success', () => {
    const content = read('app/api/push/subscribe/route.ts')
    expect(content).toContain('status: 201')
  })
})

// ── Push unsubscribe API ──────────────────────────────────────

describe('Push unsubscribe API', () => {
  it('requires auth (401 without user)', () => {
    const content = read('app/api/push/unsubscribe/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('deletes by user_id and endpoint', () => {
    const content = read('app/api/push/unsubscribe/route.ts')
    expect(content).toContain("from('push_subscriptions')")
    expect(content).toContain('.delete()')
    expect(content).toContain('.eq(\'user_id\'')
    expect(content).toContain('.eq(\'endpoint\'')
  })

  it('validates endpoint in body', () => {
    const content = read('app/api/push/unsubscribe/route.ts')
    expect(content).toContain('endpoint')
    expect(content).toContain('z.string()')
  })
})

// ── Push send utility ─────────────────────────────────────────

describe('Push send utility', () => {
  it('sets VAPID details from env vars', () => {
    const content = read('lib/push/send.ts')
    expect(content).toContain('VAPID_SUBJECT')
    expect(content).toContain('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    expect(content).toContain('VAPID_PRIVATE_KEY')
    expect(content).toContain('setVapidDetails')
  })

  it('fetches all subscriptions for user', () => {
    const content = read('lib/push/send.ts')
    expect(content).toContain("from('push_subscriptions')")
    expect(content).toContain('.eq(\'user_id\'')
  })

  it('cleans up stale subscriptions on 410/404', () => {
    const content = read('lib/push/send.ts')
    expect(content).toContain('410')
    expect(content).toContain('404')
    expect(content).toContain('staleIds')
    expect(content).toContain('.delete()')
  })

  it('exports sendPushToUser and sendPushToAll', () => {
    const content = read('lib/push/send.ts')
    expect(content).toContain('export async function sendPushToUser')
    expect(content).toContain('export async function sendPushToAll')
  })
})

// ── Checkin reminder cron ─────────────────────────────────────

describe('Checkin reminder cron', () => {
  it('is protected by CRON_SECRET header', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain('x-cron-secret')
    expect(content).toContain('CRON_SECRET')
    expect(content).toContain('403')
  })

  it('uses UK timezone for today date', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain('Europe/London')
  })

  it('only notifies active members', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain("membership_status")
    expect(content).toContain("'member'")
  })

  it('skips users who already checked in today', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain("from('checkins')")
    expect(content).toContain('checkin_date')
    expect(content).toContain('checkedInSet')
  })

  it('calls sendPushToUser for each user to notify', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain('sendPushToUser')
  })

  it('returns sent and skipped counts', () => {
    const content = read('app/api/cron/checkin-reminder/route.ts')
    expect(content).toContain('sent')
    expect(content).toContain('skipped')
  })
})

// ── vercel.json cron schedule ─────────────────────────────────

describe('vercel.json cron schedule', () => {
  it('includes checkin-reminder cron at 19:00 UTC', () => {
    const content = readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')
    const config = JSON.parse(content)
    const reminder = config.crons.find((c: { path: string }) => c.path === '/api/cron/checkin-reminder')
    expect(reminder).toBeTruthy()
    expect(reminder.schedule).toBe('0 19 * * *')
  })

  it('still includes cleanup cron', () => {
    const content = readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')
    const config = JSON.parse(content)
    const cleanup = config.crons.find((c: { path: string }) => c.path === '/api/cron/cleanup')
    expect(cleanup).toBeTruthy()
  })
})

// ── ServiceWorkerRegistration component ───────────────────────

describe('ServiceWorkerRegistration', () => {
  it('is a client component', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain("'use client'")
  })

  it('registers /sw.js service worker', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain("register('/sw.js')")
  })

  it('listens for DRAIN_CHECKIN_QUEUE message from SW', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain('DRAIN_CHECKIN_QUEUE')
    expect(content).toContain('drainQueue')
  })

  it('drains queue on online event', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain("'online'")
    expect(content).toContain('drainQueue')
  })

  it('registers checkin-sync background sync tag', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain('checkin-sync')
    expect(content).toContain('sync.register')
  })

  it('renders null (no visible UI)', () => {
    const content = read('components/pwa/ServiceWorkerRegistration.tsx')
    expect(content).toContain('return null')
  })

  it('is included in root layout', () => {
    const content = read('app/layout.tsx')
    expect(content).toContain('ServiceWorkerRegistration')
    expect(content).toContain("from '@/components/pwa/ServiceWorkerRegistration'")
  })
})

// ── PushPermission component ──────────────────────────────────

describe('PushPermission', () => {
  it('is a client component', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain("'use client'")
  })

  it('uses NEXT_PUBLIC_VAPID_PUBLIC_KEY for subscription', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    expect(content).toContain('applicationServerKey')
  })

  it('converts VAPID key from base64url to Uint8Array', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('urlBase64ToUint8Array')
    expect(content).toContain('Uint8Array')
  })

  it('POSTs subscription to /api/push/subscribe', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('/api/push/subscribe')
    expect(content).toContain("method: 'POST'")
  })

  it('DELETEs to /api/push/unsubscribe on disable', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('/api/push/unsubscribe')
    expect(content).toContain("method: 'DELETE'")
  })

  it('handles unsupported browser gracefully (returns null)', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain("'unsupported'")
    expect(content).toContain('return null')
  })

  it('handles denied permission state', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain("'denied'")
    expect(content).toContain('Blocked')
  })

  it('has accessible aria-label on enable/disable buttons', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('aria-label="Enable push notifications"')
    expect(content).toContain('aria-label="Disable push notifications"')
  })

  it('shows role=alert on error', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('role="alert"')
  })

  it('has role=region with aria-label', () => {
    const content = read('components/pwa/PushPermission.tsx')
    expect(content).toContain('role="region"')
    expect(content).toContain('aria-label="Notification settings"')
  })

  it('is rendered in the profile page', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('PushPermission')
    expect(content).toContain("from '@/components/pwa/PushPermission'")
  })
})
