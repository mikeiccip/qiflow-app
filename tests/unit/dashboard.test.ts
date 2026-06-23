import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Dashboard home page ───────────────────────────────────────

describe('Dashboard home page', () => {
  it('redirects to /login if no user', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain("redirect('/login')")
    expect(content).toContain('getUser')
  })

  it('uses UK timezone for today date', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('Europe/London')
    expect(content).toContain('en-CA')
  })

  it('fetches profile, checkin, and solar term in parallel', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('Promise.all')
    expect(content).toContain("from('profiles')")
    expect(content).toContain("from('checkins')")
    expect(content).toContain("from('solar_terms')")
  })

  it('fetches seasonal plan by solar_term name', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain("from('seasonal_plans')")
    expect(content).toContain('.eq(\'solar_term\'')
  })

  it('uses service client for all DB reads', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('createServiceClient')
  })

  it('membership check uses member and paused statuses', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain("'member'")
    expect(content).toContain("'paused'")
    expect(content).toContain('isMember')
  })

  it('renders CheckInCard, SeasonalTipCard, FeatureGrid', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('CheckInCard')
    expect(content).toContain('SeasonalTipCard')
    expect(content).toContain('FeatureGrid')
  })

  it('renders MembershipBanner only for non-members', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('MembershipBanner')
    expect(content).toContain('!isMember')
  })

  it('shows a greeting with UK-hour logic', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('greetingFor')
    expect(content).toContain('Good morning')
    expect(content).toContain('Good afternoon')
    expect(content).toContain('Good evening')
  })

  it('exports metadata with title', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('export const metadata')
    expect(content).toContain('QiFlow')
  })

  it('wraps in DashboardLayout', () => {
    const content = read('app/(dashboard)/dashboard/page.tsx')
    expect(content).toContain('DashboardLayout')
  })
})

// ── CheckInCard ───────────────────────────────────────────────

describe('CheckInCard', () => {
  it('links to /progress/log when no check-in', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('href="/progress/log"')
  })

  it('shows check-in complete state with mood emoji', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('check-in ✓')
    expect(content).toContain('checkin.mood')
  })

  it('shows energy, sleep, and pain score tiles', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('Energy')
    expect(content).toContain('Sleep')
    expect(content).toContain('Pain')
    expect(content).toContain('ScoreTile')
  })

  it('inverts pain score (lower pain = better)', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('invert')
    expect(content).toContain('10 - value')
  })

  it('has accessible region labels', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('role="region"')
    expect(content).toContain('aria-label')
  })

  it('Log today CTA links to progress log', () => {
    const content = read('app/(dashboard)/dashboard/CheckInCard.tsx')
    expect(content).toContain('Log today')
    expect(content).toContain('/progress/log')
  })
})

// ── SeasonalTipCard ───────────────────────────────────────────

describe('SeasonalTipCard', () => {
  it('links to /seasonal-plan', () => {
    const content = read('app/(dashboard)/dashboard/SeasonalTipCard.tsx')
    expect(content).toContain('href="/seasonal-plan"')
  })

  it('shows solar term name and Chinese characters', () => {
    const content = read('app/(dashboard)/dashboard/SeasonalTipCard.tsx')
    expect(content).toContain('solarTerm')
    expect(content).toContain('solarTermZh')
  })

  it('shows theme and daily focus tip when present', () => {
    const content = read('app/(dashboard)/dashboard/SeasonalTipCard.tsx')
    expect(content).toContain('theme')
    expect(content).toContain('tipOfDay')
    expect(content).toContain("Today's focus")
  })

  it('has role=region with aria-label', () => {
    const content = read('app/(dashboard)/dashboard/SeasonalTipCard.tsx')
    expect(content).toContain('role="region"')
    expect(content).toContain('aria-label="Seasonal tip"')
  })

  it('shows fallback message if no plan data', () => {
    const content = read('app/(dashboard)/dashboard/SeasonalTipCard.tsx')
    expect(content).toContain('seasonal-plan')
    expect(content).toContain('View guidance')
  })
})

// ── FeatureGrid ───────────────────────────────────────────────

describe('FeatureGrid', () => {
  it('includes Library, Workshops, Community, Food Check, Progress, Milestones', () => {
    const content = read('app/(dashboard)/dashboard/FeatureGrid.tsx')
    expect(content).toContain('/library')
    expect(content).toContain('/workshops')
    expect(content).toContain('/community')
    expect(content).toContain('/food-check')
    expect(content).toContain('/progress')
    expect(content).toContain('/loyalty')
  })

  it('has accessible section label', () => {
    const content = read('app/(dashboard)/dashboard/FeatureGrid.tsx')
    expect(content).toContain('aria-label="Features"')
  })

  it('uses aria-hidden on decorative icons', () => {
    const content = read('app/(dashboard)/dashboard/FeatureGrid.tsx')
    expect(content).toContain('aria-hidden="true"')
  })
})

// ── MembershipBanner ─────────────────────────────────────────

describe('MembershipBanner', () => {
  it('links to /membership', () => {
    const content = read('app/(dashboard)/dashboard/MembershipBanner.tsx')
    expect(content).toContain('href="/membership"')
  })

  it('shows BILLING_PROMISE', () => {
    const content = read('app/(dashboard)/dashboard/MembershipBanner.tsx')
    expect(content).toContain('BILLING_PROMISE')
  })

  it('has complementary role and accessible label', () => {
    const content = read('app/(dashboard)/dashboard/MembershipBanner.tsx')
    expect(content).toContain('role="complementary"')
    expect(content).toContain('aria-label="Membership upgrade"')
  })

  it('shows £28/month price', () => {
    const content = read('app/(dashboard)/dashboard/MembershipBanner.tsx')
    expect(content).toContain('£28')
  })
})

// ── Profile page ──────────────────────────────────────────────

describe('Profile page', () => {
  it('redirects to /login if no user', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('uses service client to fetch profile', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('createServiceClient')
    expect(content).toContain("from('profiles')")
  })

  it('shows membership status with member_since date for members', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('membership_status')
    expect(content).toContain('member_since')
    expect(content).toContain('formatDate')
  })

  it('membership check uses member and paused statuses', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain("'member'")
    expect(content).toContain("'paused'")
    expect(content).toContain('isMember')
  })

  it('shows constitution label and retake quiz link', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('CONSTITUTION_LABELS')
    expect(content).toContain('constitution_primary')
    expect(content).toContain('/constitution')
  })

  it('shows referral code', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('referral_code')
    expect(content).toContain('/loyalty')
  })

  it('renders SignOutButton', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('SignOutButton')
  })

  it('shows HEALTH_DISCLAIMER verbatim constant', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('HEALTH_DISCLAIMER')
  })

  it('wraps in DashboardLayout with title', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('DashboardLayout')
    expect(content).toContain('title="Profile"')
  })

  it('links to /subscribe for non-members', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('/subscribe')
    expect(content).toContain('Upgrade')
  })

  it('exports metadata with title', () => {
    const content = read('app/(dashboard)/profile/page.tsx')
    expect(content).toContain('export const metadata')
    expect(content).toContain('Profile')
  })
})

// ── SignOutButton ─────────────────────────────────────────────

describe('SignOutButton', () => {
  it('is a client component', () => {
    const content = read('app/(dashboard)/profile/SignOutButton.tsx')
    expect(content).toContain("'use client'")
  })

  it('calls supabase.auth.signOut', () => {
    const content = read('app/(dashboard)/profile/SignOutButton.tsx')
    expect(content).toContain('signOut')
    expect(content).toContain('createClient')
  })

  it('redirects to /login after sign out', () => {
    const content = read('app/(dashboard)/profile/SignOutButton.tsx')
    expect(content).toContain("router.push('/login')")
    expect(content).toContain('router.refresh()')
  })

  it('has accessible aria-label', () => {
    const content = read('app/(dashboard)/profile/SignOutButton.tsx')
    expect(content).toContain('aria-label="Sign out of QiFlow"')
  })

  it('disables button while loading', () => {
    const content = read('app/(dashboard)/profile/SignOutButton.tsx')
    expect(content).toContain('loading')
    expect(content).toContain('disabled={loading}')
  })
})
