import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Auth guard ────────────────────────────────────────────────

describe('Progress page auth guard', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/progress/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('imports MemberGate', () => {
    const content = read('app/(dashboard)/progress/page.tsx')
    expect(content).toContain('MemberGate')
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/progress/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })
})

// ── Check-in form ─────────────────────────────────────────────

describe('CheckInForm', () => {
  it('has all three sliders: pain, energy, sleep', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain("name=\"pain\"")
    expect(content).toContain("name=\"energy\"")
    expect(content).toContain("name=\"sleep\"")
  })

  it('has 5 mood emoji options', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain('😢')
    expect(content).toContain('😕')
    expect(content).toContain('😐')
    expect(content).toContain('😊')
    expect(content).toContain('😄')
  })

  it('has optional note field', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain("id=\"note\"")
  })

  it('enqueues offline when fetch fails', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain('enqueueCheckin')
  })

  it('shows saved-offline indicator', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain('savedOffline')
  })

  it('has aria-label on form', () => {
    const content = read('app/(dashboard)/progress/CheckInForm.tsx')
    expect(content).toContain('aria-label="Daily check-in form"')
  })
})

// ── Offline queue ─────────────────────────────────────────────

describe('checkinQueue', () => {
  it('exports enqueueCheckin', () => {
    const content = read('lib/offline/checkinQueue.ts')
    expect(content).toContain('enqueueCheckin')
  })

  it('exports drainQueue', () => {
    const content = read('lib/offline/checkinQueue.ts')
    expect(content).toContain('drainQueue')
  })

  it('exports getPendingCheckins', () => {
    const content = read('lib/offline/checkinQueue.ts')
    expect(content).toContain('getPendingCheckins')
  })

  it('uses idb for IndexedDB', () => {
    const content = read('lib/offline/checkinQueue.ts')
    expect(content).toContain("from 'idb'")
  })

  it('stores checkin_date, pain, energy, sleep, mood', () => {
    const content = read('lib/offline/checkinQueue.ts')
    expect(content).toContain('checkin_date')
    expect(content).toContain('pain')
    expect(content).toContain('energy')
    expect(content).toContain('sleep')
    expect(content).toContain('mood')
  })
})

// ── API route ─────────────────────────────────────────────────

describe('Checkins API', () => {
  it('validates mood as one of 5 emoji', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('😢')
    expect(content).toContain('😄')
  })

  it('uses upsert on (user_id, checkin_date)', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('upsert')
    expect(content).toContain('user_id,checkin_date')
  })

  it('returns 401 without auth', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('validates pain/energy/sleep 0-10 range', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('min(0)')
    expect(content).toContain('max(10)')
  })

  it('exports GET and POST handlers', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('export async function POST')
    expect(content).toContain('export async function GET')
  })
})

// ── Recharts charts ───────────────────────────────────────────

describe('ProgressCharts', () => {
  it('imports from recharts', () => {
    const content = read('app/(dashboard)/progress/ProgressCharts.tsx')
    expect(content).toContain("from 'recharts'")
  })

  it('has 7 and 30 day range toggle', () => {
    const content = read('app/(dashboard)/progress/ProgressCharts.tsx')
    expect(content).toContain('7')
    expect(content).toContain('30')
    expect(content).toContain('days')
  })

  it('renders Energy, Sleep, Pain lines', () => {
    const content = read('app/(dashboard)/progress/ProgressCharts.tsx')
    expect(content).toContain('"Energy"')
    expect(content).toContain('"Sleep"')
    expect(content).toContain('"Pain"')
  })

  it('has aria-label on section', () => {
    const content = read('app/(dashboard)/progress/ProgressCharts.tsx')
    expect(content).toContain('aria-label="Progress charts"')
  })
})

// ── Stats panel ───────────────────────────────────────────────

describe('StatsPanel', () => {
  it('computes streak', () => {
    const content = read('app/(dashboard)/progress/StatsPanel.tsx')
    expect(content).toContain('computeStreak')
  })

  it('shows re-quiz prompt after 90 days', () => {
    const content = read('app/(dashboard)/progress/StatsPanel.tsx')
    expect(content).toContain('90')
    expect(content).toContain('constitution')
  })

  it('insight is phrased as wellbeing observation (not medical claim)', () => {
    const content = read('app/(dashboard)/progress/StatsPanel.tsx')
    // Must contain "supports" or "better" — not "treats" or "cures"
    expect(content).toContain('supports')
    expect(content).not.toContain('treats')
    expect(content).not.toContain('cures')
    expect(content).not.toContain('heals')
  })
})

// ── SyncManager ───────────────────────────────────────────────

describe('SyncManager', () => {
  it('listens for online event', () => {
    const content = read('app/(dashboard)/progress/SyncManager.tsx')
    expect(content).toContain("'online'")
  })

  it('calls drainQueue', () => {
    const content = read('app/(dashboard)/progress/SyncManager.tsx')
    expect(content).toContain('drainQueue')
  })

  it('checks navigator.onLine before syncing on mount', () => {
    const content = read('app/(dashboard)/progress/SyncManager.tsx')
    expect(content).toContain('navigator.onLine')
  })
})

// ── Log page ──────────────────────────────────────────────────

describe('Log check-in page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/progress/log/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/progress/log/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })
})
