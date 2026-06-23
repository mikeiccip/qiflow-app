import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CONSTITUTION_LABELS, type ConstitutionType } from '@/types'
import type { SeasonalPlanOutput } from '@/lib/ai/schemas'
import { CheckInCard } from './CheckInCard'
import { SeasonalTipCard } from './SeasonalTipCard'
import { FeatureGrid } from './FeatureGrid'
import { MembershipBanner } from './MembershipBanner'

export const metadata: Metadata = {
  title: 'Home — QiFlow',
  description: 'Track your daily wellbeing, discover today's seasonal focus, and access your TCM wellness plan.',
}

function todayUK() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
}

function greetingFor(timeZone = 'Europe/London') {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hour12: false }).format(new Date()),
    10
  )
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const today = todayUK()

  const [profileResult, checkinResult, solarTermResult] = await Promise.all([
    service
      .from('profiles')
      .select('full_name, membership_status, constitution_primary, member_since')
      .eq('id', user.id)
      .single(),
    service
      .from('checkins')
      .select('mood, energy, sleep, pain')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle(),
    service
      .from('solar_terms')
      .select('term, term_zh, starts_on')
      .lte('starts_on', today)
      .order('starts_on', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const checkin = checkinResult.data
  const solarTerm = solarTermResult.data

  // Fetch user's seasonal plan for this term (non-blocking — plan may not exist yet)
  let seasonalPlan: SeasonalPlanOutput | null = null
  if (solarTerm?.term) {
    const { data } = await service
      .from('seasonal_plans')
      .select('plan')
      .eq('user_id', user.id)
      .eq('solar_term', solarTerm.term)
      .maybeSingle()
    seasonalPlan = (data?.plan as SeasonalPlanOutput | null) ?? null
  }

  const isMember = ['member', 'paused'].includes(profile?.membership_status ?? '')
  const firstName = (profile?.full_name ?? user.email ?? '').split(' ')[0] || 'there'
  const greeting = greetingFor()
  const constitutionType = profile?.constitution_primary as ConstitutionType | null
  const constitutionLabel = constitutionType ? CONSTITUTION_LABELS[constitutionType]?.en : null

  return (
    <DashboardLayout>
      <div className="space-y-4 px-4 py-4">

        {/* Header greeting */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-text-primary">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs text-text-secondary">
            {constitutionLabel ? (
              <>Your constitution: <span className="text-primary font-medium">{constitutionLabel}</span></>
            ) : (
              <span>
                <a href="/constitution" className="text-primary underline">Discover your TCM constitution</a>
              </span>
            )}
          </p>
        </div>

        {/* Check-in card */}
        <CheckInCard checkin={checkin} />

        {/* Seasonal tip */}
        <SeasonalTipCard
          solarTerm={solarTerm?.term ?? null}
          solarTermZh={solarTerm?.term_zh ?? null}
          theme={seasonalPlan?.theme ?? null}
          tipOfDay={seasonalPlan?.daily_focus?.[0]?.morning_tip ?? null}
        />

        {/* Membership upgrade banner (free users only) */}
        {!isMember && <MembershipBanner />}

        {/* Feature grid */}
        <FeatureGrid />

      </div>
    </DashboardLayout>
  )
}
