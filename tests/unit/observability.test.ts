import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(__dirname, '../..')
const src = (...parts: string[]) => resolve(root, 'src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

function readRoot(filename: string) {
  return readFileSync(resolve(root, filename), 'utf-8')
}

// ── Sentry config files ───────────────────────────────────────

describe('Sentry client config', () => {
  it('initialises Sentry with DSN from env', () => {
    const content = readRoot('sentry.client.config.ts')
    expect(content).toContain('Sentry.init')
    expect(content).toContain('NEXT_PUBLIC_SENTRY_DSN')
  })

  it('is enabled only in production', () => {
    const content = readRoot('sentry.client.config.ts')
    expect(content).toContain("enabled: process.env.NODE_ENV === 'production'")
  })

  it('includes session replay with maskAllText', () => {
    const content = readRoot('sentry.client.config.ts')
    expect(content).toContain('replayIntegration')
    expect(content).toContain('maskAllText: true')
    expect(content).toContain('blockAllMedia: true')
  })

  it('strips request body in beforeSend (health data guard)', () => {
    const content = readRoot('sentry.client.config.ts')
    expect(content).toContain('beforeSend')
    expect(content).toContain('request.data')
    expect(content).toContain('delete')
  })
})

describe('Sentry server config', () => {
  it('initialises Sentry with DSN', () => {
    const content = readRoot('sentry.server.config.ts')
    expect(content).toContain('Sentry.init')
    expect(content).toContain('NEXT_PUBLIC_SENTRY_DSN')
  })

  it('strips request body and auth headers in beforeSend', () => {
    const content = readRoot('sentry.server.config.ts')
    expect(content).toContain('beforeSend')
    expect(content).toContain('request.data')
    expect(content).toContain('authorization')
    expect(content).toContain('cookie')
  })
})

describe('Sentry edge config', () => {
  it('initialises Sentry', () => {
    const content = readRoot('sentry.edge.config.ts')
    expect(content).toContain('Sentry.init')
    expect(content).toContain('NEXT_PUBLIC_SENTRY_DSN')
  })
})

// ── instrumentation.ts ────────────────────────────────────────

describe('instrumentation.ts', () => {
  it('registers server Sentry on nodejs runtime', () => {
    const content = readRoot('instrumentation.ts')
    expect(content).toContain("NEXT_RUNTIME === 'nodejs'")
    expect(content).toContain('sentry.server.config')
  })

  it('registers edge Sentry on edge runtime', () => {
    const content = readRoot('instrumentation.ts')
    expect(content).toContain("NEXT_RUNTIME === 'edge'")
    expect(content).toContain('sentry.edge.config')
  })

  it('exports a register function', () => {
    const content = readRoot('instrumentation.ts')
    expect(content).toContain('export async function register')
  })
})

// ── next.config.mjs ───────────────────────────────────────────

describe('next.config.mjs — Sentry + instrumentation', () => {
  it('wraps config with withSentryConfig', () => {
    const content = readRoot('next.config.mjs')
    expect(content).toContain('withSentryConfig')
    expect(content).toContain("from '@sentry/nextjs'")
  })

  it('enables instrumentationHook in experimental', () => {
    const content = readRoot('next.config.mjs')
    expect(content).toContain('instrumentationHook: true')
  })

  it('hides source maps', () => {
    const content = readRoot('next.config.mjs')
    expect(content).toContain('hideSourceMaps: true')
  })
})

// ── global-error.tsx ──────────────────────────────────────────

describe('global-error.tsx', () => {
  it('is a client component', () => {
    const content = read('app/global-error.tsx')
    expect(content).toContain("'use client'")
  })

  it('captures error to Sentry in useEffect', () => {
    const content = read('app/global-error.tsx')
    expect(content).toContain('Sentry.captureException')
    expect(content).toContain('useEffect')
  })

  it('shows a reset (try again) button', () => {
    const content = read('app/global-error.tsx')
    expect(content).toContain('reset')
    expect(content).toContain('Try again')
  })

  it('renders standalone html/body (required for global error boundary)', () => {
    const content = read('app/global-error.tsx')
    expect(content).toContain('<html')
    expect(content).toContain('<body')
  })

  it('shows error digest if present', () => {
    const content = read('app/global-error.tsx')
    expect(content).toContain('digest')
  })
})

// ── ErrorBoundary component ───────────────────────────────────

describe('ErrorBoundary component', () => {
  it('is a client component', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain("'use client'")
  })

  it('is a class component extending React.Component', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain('React.Component')
    expect(content).toContain('getDerivedStateFromError')
    expect(content).toContain('componentDidCatch')
  })

  it('calls Sentry.captureException on error', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain('Sentry.captureException')
  })

  it('stores the Sentry event ID for display', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain('eventId')
    expect(content).toContain('setState')
  })

  it('has role=alert on error fallback', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain('role="alert"')
  })

  it('provides Try again and Home links', () => {
    const content = read('components/layout/ErrorBoundary.tsx')
    expect(content).toContain('Try again')
    expect(content).toContain('/dashboard')
  })

  it('is used in the dashboard route group layout', () => {
    const content = read('app/(dashboard)/layout.tsx')
    expect(content).toContain('ErrorBoundary')
    expect(content).toContain("from '@/components/layout/ErrorBoundary'")
  })
})

// ── Server-side track() utility ───────────────────────────────

describe('track() analytics utility', () => {
  it('inserts into analytics_events via service client', () => {
    const content = read('lib/analytics/track.ts')
    expect(content).toContain('createServiceClient')
    expect(content).toContain("from('analytics_events')")
    expect(content).toContain('.insert(')
  })

  it('filters to allowed property keys only', () => {
    const content = read('lib/analytics/track.ts')
    expect(content).toContain('ALLOWED_PROPERTY_KEYS')
    expect(content).toContain('content_id')
    expect(content).toContain('milestone')
  })

  it('never throws — silently catches errors', () => {
    const content = read('lib/analytics/track.ts')
    expect(content).toContain('} catch {')
    // No rethrow
    expect(content).not.toContain('throw ')
  })

  it('is called from checkins POST handler', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain("track(user.id, 'check_in'")
    expect(content).toContain("from '@/lib/analytics/track'")
  })
})

// ── useAnalytics hook ─────────────────────────────────────────

describe('useAnalytics hook', () => {
  it('is a client hook', () => {
    const content = read('hooks/useAnalytics.ts')
    expect(content).toContain("'use client'")
  })

  it('POSTs to /api/analytics with keepalive', () => {
    const content = read('hooks/useAnalytics.ts')
    expect(content).toContain('/api/analytics')
    expect(content).toContain("method: 'POST'")
    expect(content).toContain('keepalive: true')
  })

  it('swallows errors with .catch', () => {
    const content = read('hooks/useAnalytics.ts')
    expect(content).toContain('.catch(')
  })

  it('returns trackEvent function', () => {
    const content = read('hooks/useAnalytics.ts')
    expect(content).toContain('trackEvent')
    expect(content).toContain('useCallback')
  })
})

// ── Milestone push notification ───────────────────────────────

describe('Milestone push notification', () => {
  it('dynamically imports sendPushToUser after award', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("import('@/lib/push/send')")
    expect(content).toContain('sendPushToUser')
  })

  it('sends to /loyalty URL', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("url: '/loyalty'")
  })

  it('is fire-and-forget with .catch', () => {
    const content = read('lib/loyalty/milestones.ts')
    const pushSection = content.split('sendPushToUser(')[1]
    expect(pushSection).toContain('.catch(() => {})')
  })

  it('tracks milestone_earned event', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("'milestone_earned'")
    expect(content).toContain('track(')
  })
})

// ── Admin analytics page ──────────────────────────────────────

describe('Admin analytics page', () => {
  it('redirects to /login if no user', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('fetches total members and new-this-week', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('membership_status')
    expect(content).toContain('member_since')
    expect(content).toContain('totalMembers')
    expect(content).toContain('newMembers')
  })

  it('fetches active users via checkins last 7 days', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain("from('checkins')")
    expect(content).toContain('activeUsers')
  })

  it('counts events by name from analytics_events', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain("from('analytics_events')")
    expect(content).toContain('eventCounts')
    expect(content).toContain('topEvents')
  })

  it('fetches push subscription count', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain("from('push_subscriptions')")
    expect(content).toContain('pushSubs')
  })

  it('fetches all stats in parallel with Promise.all', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('Promise.all')
  })

  it('renders an accessible table for event counts', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('<table')
    expect(content).toContain('aria-label')
  })

  it('uses service client for all queries', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('createServiceClient')
  })

  it('uses UK-aware 7-day window for dates', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('sevenDaysAgo')
  })

  it('exports metadata with title', () => {
    const content = read('app/admin/analytics/page.tsx')
    expect(content).toContain('export const metadata')
    expect(content).toContain('Analytics')
  })
})

// ── Admin home page ───────────────────────────────────────────

describe('Admin home page', () => {
  it('links to analytics, qa, and workshops', () => {
    const content = read('app/admin/page.tsx')
    expect(content).toContain('/admin/analytics')
    expect(content).toContain('/admin/qa')
    expect(content).toContain('/admin/workshops')
  })

  it('has accessible nav landmark', () => {
    const content = read('app/admin/page.tsx')
    expect(content).toContain('aria-label="Admin sections"')
  })
})
