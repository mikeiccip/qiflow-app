import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Milestone config ──────────────────────────────────────────

describe('MILESTONES config', () => {
  it('exports MILESTONES constant', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('export const MILESTONES')
  })

  it('includes all 8 milestone keys', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('first_checkin')
    expect(content).toContain('streak_7')
    expect(content).toContain('streak_30')
    expect(content).toContain('constitution_complete')
    expect(content).toContain('month_1')
    expect(content).toContain('month_3')
    expect(content).toContain('month_6')
    expect(content).toContain('referral_1')
  })

  it('each milestone has icon, label, description, order', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('icon:')
    expect(content).toContain('label:')
    expect(content).toContain('description:')
    expect(content).toContain('order:')
  })
})

// ── checkAndAwardMilestones ───────────────────────────────────

describe('checkAndAwardMilestones', () => {
  it('is exported as async function', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('export async function checkAndAwardMilestones')
  })

  it('uses service client (not user client)', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('createServiceClient')
    expect(content).not.toContain('createClient()')
  })

  it('fetches existing milestones before checking conditions', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("from('loyalty_milestones')")
    expect(content).toContain("eq('user_id', userId)")
  })

  it('uses Promise.all for parallel data fetching', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('Promise.all')
  })

  it('skips already-earned milestones (idempotent)', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('alreadyEarned')
    expect(content).toContain('.has(')
  })

  it('uses UK timezone for streak calculation', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('Europe/London')
  })

  it('checks checkin count for first_checkin', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('checkinCount >= 1')
  })

  it('checks streak >= 7 for streak_7', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('streak >= 7')
  })

  it('checks streak >= 30 for streak_30', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('streak >= 30')
  })

  it('checks constitution_results for constitution_complete', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("from('constitution_results')")
    expect(content).toContain('constitutionCount >= 1')
  })

  it('checks member_since for month milestones', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('member_since')
    expect(content).toContain('monthsSinceMembership')
  })

  it('checks converted referrals for referral_1', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain("from('referrals')")
    expect(content).toContain("status', 'converted'")
    expect(content).toContain('convertedReferrals >= 1')
  })

  it('inserts newly earned milestones', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('.insert(toInsert)')
  })

  it('returns array of newly earned milestone keys', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('return toInsert.map')
    expect(content).toContain('MilestoneKey')
  })
})

// ── getMilestoneStatuses ──────────────────────────────────────

describe('getMilestoneStatuses', () => {
  it('is exported', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('export async function getMilestoneStatuses')
  })

  it('returns all milestones with earned flag', () => {
    const content = read('lib/loyalty/milestones.ts')
    expect(content).toContain('earned:')
    expect(content).toContain('reached_at:')
  })
})

// ── Referral utilities ────────────────────────────────────────

describe('getReferralStats', () => {
  it('is exported', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('export async function getReferralStats')
  })

  it('returns referral_link with APP_URL', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('referral_link')
    expect(content).toContain('NEXT_PUBLIC_APP_URL')
    expect(content).toContain('/signup?ref=')
  })

  it('returns pending and converted counts', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain("status === 'pending'")
    expect(content).toContain("status === 'converted'")
  })
})

describe('createReferralRecord', () => {
  it('is exported', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('export async function createReferralRecord')
  })

  it('prevents self-referral', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('Cannot refer yourself')
  })

  it('is idempotent — checks for existing record', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('existing')
    expect(content).toContain("from('referrals')")
    expect(content).toContain('referred_id')
  })

  it('sets referred_by on the profile', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('referred_by')
    expect(content).toContain("from('profiles')")
    expect(content).toContain('.update(')
  })
})

describe('convertReferral', () => {
  it('is exported', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('export async function convertReferral')
  })

  it("sets status to 'converted'", () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain("status: 'converted'")
  })

  it('sets reward_granted = true', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('reward_granted: true')
  })

  it('awards milestones to the referrer', () => {
    const content = read('lib/loyalty/referral.ts')
    expect(content).toContain('checkAndAwardMilestones')
    expect(content).toContain('referrer_id')
  })
})

// ── API routes ─────────────────────────────────────────────────

describe('Milestones API', () => {
  it('GET returns 401 without auth', () => {
    const content = read('app/api/loyalty/milestones/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('GET returns milestone statuses', () => {
    const content = read('app/api/loyalty/milestones/route.ts')
    expect(content).toContain('getMilestoneStatuses')
    expect(content).toContain('milestones')
  })

  it('POST triggers checkAndAwardMilestones', () => {
    const content = read('app/api/loyalty/milestones/route.ts')
    expect(content).toContain('checkAndAwardMilestones')
    expect(content).toContain('awarded')
  })
})

describe('Referral API', () => {
  it('GET returns 401 without auth', () => {
    const content = read('app/api/loyalty/referral/route.ts')
    expect(content).toContain('401')
  })

  it('GET returns referral stats', () => {
    const content = read('app/api/loyalty/referral/route.ts')
    expect(content).toContain('getReferralStats')
  })
})

describe('Referral claim API', () => {
  it('POST returns 401 without auth', () => {
    const content = read('app/api/loyalty/referral/claim/route.ts')
    expect(content).toContain('401')
  })

  it('validates referral_code', () => {
    const content = read('app/api/loyalty/referral/claim/route.ts')
    expect(content).toContain('referral_code')
    expect(content).toContain('z.string()')
  })

  it('calls createReferralRecord', () => {
    const content = read('app/api/loyalty/referral/claim/route.ts')
    expect(content).toContain('createReferralRecord')
  })
})

// ── Loyalty page ───────────────────────────────────────────────

describe('Loyalty page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('calls checkAndAwardMilestones on page load', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain('checkAndAwardMilestones')
  })

  it('skips milestone check for non-members', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain('isMember')
    expect(content).toContain('Promise.resolve([])')
  })

  it('shows MemberGate for non-member milestone section', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain('MemberGate')
  })

  it('shows referral card for all authenticated users', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain('ReferralCard')
    expect(content).toContain('getReferralStats')
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/loyalty/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })
})

// ── MilestoneGrid ─────────────────────────────────────────────

describe('MilestoneGrid', () => {
  it('is a server component (no use client)', () => {
    const content = read('app/(dashboard)/loyalty/MilestoneGrid.tsx')
    expect(content).not.toContain("'use client'")
  })

  it('shows earned and locked sections', () => {
    const content = read('app/(dashboard)/loyalty/MilestoneGrid.tsx')
    expect(content).toContain('Earned')
    expect(content).toContain('Still to earn')
  })

  it('has aria-label on section', () => {
    const content = read('app/(dashboard)/loyalty/MilestoneGrid.tsx')
    expect(content).toContain('aria-label="Your achievements"')
  })

  it('shows reached_at date on earned badges', () => {
    const content = read('app/(dashboard)/loyalty/MilestoneGrid.tsx')
    expect(content).toContain('reached_at')
    expect(content).toContain('formatDate')
  })

  it('badges have aria-label with earned status', () => {
    const content = read('app/(dashboard)/loyalty/MilestoneGrid.tsx')
    expect(content).toContain('aria-label={')
    expect(content).toContain('not yet earned')
  })
})

// ── ReferralCard ──────────────────────────────────────────────

describe('ReferralCard', () => {
  it('is a client component', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain("'use client'")
  })

  it('has copy-to-clipboard functionality', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('navigator.clipboard')
    expect(content).toContain('copyLink')
    expect(content).toContain('copied')
  })

  it('has fallback for clipboard API unavailability', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('catch')
    expect(content).toContain('referral-link-input')
    expect(content).toContain('.select()')
  })

  it('shows pending and converted referral counts', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('stats.pending')
    expect(content).toContain('stats.converted')
  })

  it('shows the referral link in a readonly input', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('readOnly')
    expect(content).toContain('stats.referral_link')
  })

  it('aria-label on copy button changes after copy', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('copied ? \'Link copied\' : \'Copy referral link\'')
  })

  it('has role=region with aria-label', () => {
    const content = read('app/(dashboard)/loyalty/ReferralCard.tsx')
    expect(content).toContain('role="region"')
    expect(content).toContain('aria-label="Referral programme"')
  })
})

// ── Checkin route integration ─────────────────────────────────

describe('Checkin API — milestone integration', () => {
  it('imports checkAndAwardMilestones', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('checkAndAwardMilestones')
    expect(content).toContain("from '@/lib/loyalty/milestones'")
  })

  it('calls milestone check after successful upsert', () => {
    const content = read('app/api/checkins/route.ts')
    const upsertIdx = content.indexOf('.upsert(')
    const milestoneIdx = content.indexOf('checkAndAwardMilestones(')
    expect(milestoneIdx).toBeGreaterThan(upsertIdx)
  })

  it('milestone check is fire-and-forget (does not block response)', () => {
    const content = read('app/api/checkins/route.ts')
    expect(content).toContain('.catch(() => {})')
    // Response is returned after the fire-and-forget call
    expect(content).toContain("return NextResponse.json({ checkin: data }")
  })
})
