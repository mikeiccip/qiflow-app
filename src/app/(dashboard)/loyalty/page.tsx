import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout'
import { MemberGate, HealthDisclaimer } from '@/components/ui'
import { checkAndAwardMilestones, getMilestoneStatuses } from '@/lib/loyalty/milestones'
import { getReferralStats } from '@/lib/loyalty/referral'
import { createServiceClient } from '@/lib/supabase/service'
import { MilestoneGrid } from './MilestoneGrid'
import { ReferralCard } from './ReferralCard'

export const metadata: Metadata = {
  title: 'Your Journey',
  description: 'Track your milestones, refer friends, and celebrate your wellness journey.',
}

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('membership_status')
    .eq('id', user.id)
    .single()

  const isMember = ['member', 'paused'].includes(profile?.membership_status ?? '')

  // Check and award any newly earned milestones on page load (idempotent)
  // Run in parallel with stats fetches
  const [, milestones, referralStats] = await Promise.all([
    isMember ? checkAndAwardMilestones(user.id) : Promise.resolve([]),
    getMilestoneStatuses(user.id),
    getReferralStats(user.id),
  ])

  return (
    <DashboardLayout title="Your Journey">
      <div className="max-w-lg mx-auto space-y-6 pb-8">
        <div className="pt-2 space-y-1">
          <h1 className="text-xl font-bold text-text-primary">Your Journey</h1>
          <p className="text-sm text-text-secondary">
            Milestones, achievements, and your referral programme
          </p>
        </div>

        {/* Milestones */}
        {isMember ? (
          <MilestoneGrid milestones={milestones} />
        ) : (
          <MemberGate isMember={false} featureName="loyalty milestones">
            <div className="grid grid-cols-2 gap-2" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-sm border border-border bg-surface p-3 h-24 opacity-40 blur-[2px]" />
              ))}
            </div>
          </MemberGate>
        )}

        {/* Referral — available to all authenticated users */}
        {referralStats && <ReferralCard stats={referralStats} />}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
