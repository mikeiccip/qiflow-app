import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { MemberGate, HealthDisclaimer, Card } from '@/components/ui'
import { CheckInForm } from './CheckInForm'
import { ProgressCharts } from './ProgressCharts'
import { StatsPanel } from './StatsPanel'
import { SyncManager } from './SyncManager'

export const metadata: Metadata = {
  title: 'Progress',
  description: 'View your wellbeing trends, check-in history, and health progress over time.',
}

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [profileResult, checkinsResult, quizResult] = await Promise.all([
    service
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single(),
    service
      .from('checkins')
      .select('id, checkin_date, pain, energy, sleep, mood, note, created_at')
      .eq('user_id', user.id)
      .gte(
        'checkin_date',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .order('checkin_date', { ascending: true }),
    service
      .from('constitution_results')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const checkins = checkinsResult.data ?? []
  const lastQuizDate = quizResult.data?.created_at ?? null

  const todayDate = new Date().toISOString().split('T')[0]
  const todayCheckin = checkins.find((c) => c.checkin_date === todayDate)

  return (
    <DashboardLayout title="Progress">
      <SyncManager />
      <div className="max-w-lg mx-auto space-y-4 pb-8">
        {isMember ? (
          <>
            {/* Today's check-in */}
            <Card padding="md">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                {todayCheckin ? "Update today's check-in" : "Today's check-in"}
              </h2>
              <CheckInForm
                todayDate={todayDate}
                existingCheckin={todayCheckin ?? undefined}
              />
            </Card>

            {/* Charts */}
            {checkins.length > 0 && (
              <ProgressCharts data={checkins} />
            )}

            {/* Stats */}
            <StatsPanel checkins30={checkins} lastQuizDate={lastQuizDate} />
          </>
        ) : (
          <MemberGate isMember={false} featureName="Progress Tracker">
            <div className="h-48 bg-gray-50 rounded-card" aria-hidden="true" />
          </MemberGate>
        )}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
