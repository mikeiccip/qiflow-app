/**
 * Referral utilities — server-only.
 * Called from API routes and the Stripe webhook handler.
 */
import { createServiceClient } from '@/lib/supabase/service'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qiflow.app'

export interface ReferralStats {
  referral_code: string
  referral_link: string
  pending: number
  converted: number
}

export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  const service = createServiceClient()

  const [profileResult, referralsResult] = await Promise.all([
    service.from('profiles').select('referral_code').eq('id', userId).single(),
    service
      .from('referrals')
      .select('status')
      .eq('referrer_id', userId),
  ])

  if (!profileResult.data?.referral_code) return null

  const referrals = referralsResult.data ?? []
  const code = profileResult.data.referral_code

  return {
    referral_code: code,
    referral_link: `${APP_URL}/signup?ref=${code}`,
    pending:   referrals.filter((r) => r.status === 'pending').length,
    converted: referrals.filter((r) => r.status === 'converted').length,
  }
}

/**
 * Create a pending referral record when a new user signs up via a referral link.
 * Called from the signup / onboarding flow (Phase 19).
 * Idempotent: if a referral already exists for this referred_id, does nothing.
 */
export async function createReferralRecord(
  referralCode: string,
  newUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const service = createServiceClient()

  // Look up referrer by code
  const { data: referrer } = await service
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) return { ok: false, error: 'Invalid referral code' }
  if (referrer.id === newUserId) return { ok: false, error: 'Cannot refer yourself' }

  // Check for existing record
  const { data: existing } = await service
    .from('referrals')
    .select('id')
    .eq('referred_id', newUserId)
    .limit(1)

  if ((existing ?? []).length > 0) return { ok: true } // already recorded

  const { error } = await service.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: newUserId,
    status: 'pending',
  })

  if (error) return { ok: false, error: error.message }

  // Record the referral code on the referred user's profile
  await service
    .from('profiles')
    .update({ referred_by: referralCode })
    .eq('id', newUserId)

  return { ok: true }
}

/**
 * Mark a referral as converted when the referred user subscribes.
 * Called from the Stripe subscription webhook.
 * Awards `referral_1` milestone to the referrer.
 */
export async function convertReferral(subscribedUserId: string): Promise<void> {
  const service = createServiceClient()

  const { data } = await service
    .from('referrals')
    .update({ status: 'converted', reward_granted: true })
    .eq('referred_id', subscribedUserId)
    .eq('status', 'pending')
    .select('referrer_id')
    .single()

  if (!data?.referrer_id) return

  // Award milestone to referrer (safe to call even if already earned)
  const { checkAndAwardMilestones } = await import('./milestones')
  await checkAndAwardMilestones(data.referrer_id)
}
