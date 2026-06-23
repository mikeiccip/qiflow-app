/**
 * Loyalty milestone engine — server-only.
 * Milestones are awarded once and never revoked.
 * RLS: only admin can insert; we use the service client here.
 */
import { createServiceClient } from '@/lib/supabase/service'
import { track } from '@/lib/analytics/track'

export const MILESTONES = {
  first_checkin:         { label: 'First Check-In',        icon: '📋', order: 1, description: 'Logged your first daily wellbeing check-in' },
  streak_7:              { label: '7-Day Streak',           icon: '🔥', order: 2, description: 'Checked in 7 days in a row' },
  streak_30:             { label: '30-Day Streak',          icon: '⭐', order: 3, description: 'Checked in 30 days in a row' },
  constitution_complete: { label: 'Know Your Constitution', icon: '🧬', order: 4, description: 'Completed the TCM constitution quiz' },
  month_1:               { label: '1 Month Member',         icon: '🌱', order: 5, description: 'Been a QiFlow member for one month' },
  month_3:               { label: '3 Month Member',         icon: '🌿', order: 6, description: 'Been a QiFlow member for three months' },
  month_6:               { label: '6 Month Member',         icon: '🌳', order: 7, description: 'Been a QiFlow member for six months' },
  referral_1:            { label: 'First Referral',         icon: '🤝', order: 8, description: 'Brought a friend to QiFlow who became a member' },
} as const

export type MilestoneKey = keyof typeof MILESTONES

export interface EarnedMilestone {
  milestone: MilestoneKey
  reached_at: string
  reward_granted: boolean
}

export interface MilestoneStatus {
  key: MilestoneKey
  earned: boolean
  reached_at: string | null
  label: string
  icon: string
  description: string
  order: number
}

// ── Streak helper ──────────────────────────────────────────────

async function computeStreak(userId: string): Promise<number> {
  const service = createServiceClient()
  const { data } = await service
    .from('checkins')
    .select('checkin_date')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(32)

  if (!data || data.length === 0) return 0

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(yesterdayDate)

  let streak = 0
  let expected = todayStr

  // Allow streak to start from today or yesterday
  if (data[0].checkin_date !== todayStr && data[0].checkin_date !== yesterdayStr) return 0
  if (data[0].checkin_date === yesterdayStr) expected = yesterdayStr

  for (const { checkin_date } of data) {
    if (checkin_date === expected) {
      streak++
      const d = new Date(expected + 'T12:00:00Z')
      d.setUTCDate(d.getUTCDate() - 1)
      expected = d.toISOString().split('T')[0]
    } else {
      break
    }
  }

  return streak
}

// ── Public API ─────────────────────────────────────────────────

/** Return all milestones with earned status for the user. */
export async function getMilestoneStatuses(userId: string): Promise<MilestoneStatus[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('loyalty_milestones')
    .select('milestone, reached_at, reward_granted')
    .eq('user_id', userId)

  const earnedMap = new Map<string, string>()
  for (const row of data ?? []) {
    earnedMap.set(row.milestone, row.reached_at)
  }

  return Object.entries(MILESTONES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, cfg]) => ({
      key: key as MilestoneKey,
      earned: earnedMap.has(key),
      reached_at: earnedMap.get(key) ?? null,
      label: cfg.label,
      icon: cfg.icon,
      description: cfg.description,
      order: cfg.order,
    }))
}

/**
 * Check all milestone conditions for a user and insert any newly earned ones.
 * Returns the keys of newly awarded milestones.
 * Safe to call multiple times — will not double-award.
 */
export async function checkAndAwardMilestones(userId: string): Promise<MilestoneKey[]> {
  const service = createServiceClient()

  // Fetch everything needed in parallel
  const [existingResult, profileResult, checkinCountResult, constitutionResult, referralResult] =
    await Promise.all([
      service.from('loyalty_milestones').select('milestone').eq('user_id', userId),
      service.from('profiles').select('member_since').eq('id', userId).single(),
      service.from('checkins').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      service
        .from('constitution_results')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      service
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('status', 'converted'),
    ])

  const alreadyEarned = new Set((existingResult.data ?? []).map((r) => r.milestone))
  const checkinCount = checkinCountResult.count ?? 0
  const constitutionCount = constitutionResult.count ?? 0
  const convertedReferrals = referralResult.count ?? 0
  const memberSince = profileResult.data?.member_since ?? null

  // Streak only needed if relevant milestones not yet earned
  let streak = 0
  const needsStreak = !alreadyEarned.has('streak_7') || !alreadyEarned.has('streak_30')
  if (needsStreak && checkinCount > 0) {
    streak = await computeStreak(userId)
  }

  const now = new Date()

  function monthsSinceMembership(): number | null {
    if (!memberSince) return null
    const diff = now.getTime() - new Date(memberSince).getTime()
    return diff / (1000 * 60 * 60 * 24 * 30)
  }

  const conditions: Record<MilestoneKey, boolean> = {
    first_checkin:         checkinCount >= 1,
    streak_7:              streak >= 7,
    streak_30:             streak >= 30,
    constitution_complete: constitutionCount >= 1,
    month_1:               (monthsSinceMembership() ?? 0) >= 1,
    month_3:               (monthsSinceMembership() ?? 0) >= 3,
    month_6:               (monthsSinceMembership() ?? 0) >= 6,
    referral_1:            convertedReferrals >= 1,
  }

  const toInsert = Object.entries(conditions)
    .filter(([key, qualifies]) => qualifies && !alreadyEarned.has(key))
    .map(([key]) => ({ user_id: userId, milestone: key }))

  if (toInsert.length > 0) {
    await service.from('loyalty_milestones').insert(toInsert)

    // Notify user of each newly earned milestone — fire-and-forget
    const { sendPushToUser } = await import('@/lib/push/send')
    for (const { user_id, milestone } of toInsert) {
      const cfg = MILESTONES[milestone as MilestoneKey]
      sendPushToUser(user_id, {
        title: `Milestone unlocked: ${cfg.label} ${cfg.icon}`,
        body: cfg.description,
        url: '/loyalty',
      }).catch(() => {})
      track(user_id, 'milestone_earned', { milestone }).catch(() => {})
    }
  }

  return toInsert.map((r) => r.milestone as MilestoneKey)
}
