import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { Badge, Card, MemberGate, HealthDisclaimer, SkeletonCard } from '@/components/ui'
import { CONSTITUTION_LABELS, type ConstitutionType } from '@/types'
import { getOrGenerateSeasonalPlan } from '@/lib/ai/seasonalPlan'
import { DayCards } from './DayCards'

export const metadata: Metadata = {
  title: 'Seasonal Wellness Plan',
  description: 'Follow your personalised TCM seasonal plan aligned to the current solar term.',
}

export default async function SeasonalPlanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('membership_status, constitution_primary')
    .eq('id', user.id)
    .single()

  const isMember = ['member', 'paused'].includes(profile?.membership_status ?? '')

  if (!isMember) {
    return (
      <DashboardLayout title="Seasonal Plan">
        <div className="max-w-lg mx-auto space-y-4 pb-8">
          <MemberGate isMember={false} featureName="Seasonal Wellness Plan">
            <div className="h-64 bg-gray-50 rounded-card" aria-hidden="true" />
          </MemberGate>
          <HealthDisclaimer compact />
        </div>
      </DashboardLayout>
    )
  }

  const constitution = profile?.constitution_primary as ConstitutionType | null

  // Fetch or generate — cached on first view, instant thereafter
  const { plan, currentTerm, fromCache } = await getOrGenerateSeasonalPlan(user.id, constitution)

  const constitutionLabel = constitution ? CONSTITUTION_LABELS[constitution] : null

  return (
    <DashboardLayout title="Seasonal Plan">
      <div className="max-w-lg mx-auto space-y-4 pb-8">

        {/* Header */}
        <div className="pt-2 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">{plan.solar_term_name}</h1>
            <span className="text-base text-text-secondary">{plan.solar_term_zh}</span>
          </div>
          <p className="text-xs text-text-secondary">{plan.dates}</p>
          {constitutionLabel && (
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="constitution" constitution={constitution!}>
                {constitutionLabel.en}
              </Badge>
              <span className="text-xs text-text-secondary">personalised plan</span>
            </div>
          )}
          {!constitution && (
            <p className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-btn px-2 py-1 inline-block mt-1">
              Take the{' '}
              <a href="/constitution" className="underline font-medium">
                constitution quiz
              </a>{' '}
              to personalise this plan
            </p>
          )}
        </div>

        {/* Theme */}
        <Card padding="md" className="bg-primary-light border border-primary/20">
          <p className="text-sm text-primary leading-relaxed">{plan.theme}</p>
        </Card>

        {/* 7-day swipeable cards */}
        <DayCards
          days={plan.daily_focus}
          termStartDate={currentTerm?.starts_on ?? new Date().toISOString().split('T')[0]}
        />

        {/* Featured recipe */}
        <section aria-label="Featured recipe">
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span aria-hidden="true">🍲</span> Featured Recipe
            </h2>
            <p className="text-base font-semibold text-primary mb-2">{plan.featured_recipe.name}</p>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                  Ingredients
                </p>
                <ul className="space-y-0.5" role="list">
                  {plan.featured_recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-text-primary flex gap-2">
                      <span aria-hidden="true" className="text-primary shrink-0">·</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                  Method
                </p>
                <ol className="space-y-2" role="list">
                  {plan.featured_recipe.method.map((step, i) => (
                    <li key={i} className="text-sm text-text-primary flex gap-2">
                      <span className="font-semibold text-primary shrink-0 w-4">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        </section>

        {/* Acupoint of the week */}
        <section aria-label="Acupoint of the week">
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span aria-hidden="true">☯️</span> Acupoint of the Week
            </h2>
            <p className="text-base font-semibold text-primary mb-3">
              {plan.acupoint_of_the_week.name}
            </p>

            <div className="space-y-2.5">
              <AcupointRow label="Location" text={plan.acupoint_of_the_week.location} />
              <AcupointRow label="Traditionally supports" text={plan.acupoint_of_the_week.benefit} />
              <AcupointRow label="How to use" text={plan.acupoint_of_the_week.how_to_stimulate} />
            </div>
          </Card>
        </section>

        {!fromCache && (
          <p className="text-xs text-text-secondary text-center">
            Plan personalised for this solar term · won&rsquo;t regenerate until next term
          </p>
        )}

        <HealthDisclaimer />
      </div>
    </DashboardLayout>
  )
}

function AcupointRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-text-primary leading-relaxed">{text}</p>
    </div>
  )
}
