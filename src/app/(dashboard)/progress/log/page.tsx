import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { Card, HealthDisclaimer, MemberGate } from '@/components/ui'
import { CheckInForm } from '../CheckInForm'
import { SyncManager } from '../SyncManager'

export const metadata: Metadata = {
  title: 'Log check-in',
  description: "Log today's mood, energy, sleep, and pain to track your wellbeing journey.",
}

export default async function LogCheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const todayDate = new Date().toISOString().split('T')[0]

  const [profileResult, todayResult] = await Promise.all([
    service
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single(),
    service
      .from('checkins')
      .select('pain, energy, sleep, mood, note')
      .eq('user_id', user.id)
      .eq('checkin_date', todayDate)
      .maybeSingle(),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')

  return (
    <DashboardLayout title="Log check-in">
      <SyncManager />
      <div className="max-w-lg mx-auto space-y-4 pb-8">
        {isMember ? (
          <Card padding="md">
            <h1 className="text-base font-semibold text-text-primary mb-1">Daily check-in</h1>
            <p className="text-xs text-text-secondary mb-4">
              60 seconds to log how you&rsquo;re feeling today
            </p>
            <CheckInForm
              todayDate={todayDate}
              existingCheckin={todayResult.data ?? undefined}
            />
          </Card>
        ) : (
          <MemberGate isMember={false} featureName="Daily check-in">
            <div className="h-48 bg-gray-50 rounded-card" aria-hidden="true" />
          </MemberGate>
        )}
        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
