import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { Badge, Card, MemberGate, HealthDisclaimer } from '@/components/ui'
import { CONSTITUTION_LABELS, type Workshop } from '@/types'
import { WorkshopSearch } from './WorkshopSearch'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Workshops',
  description: 'Watch recorded TCM workshops and download practitioner resources.',
}

const FREE_PREVIEW_COUNT = 3

interface WorkshopsPageProps {
  searchParams: { q?: string; category?: string }
}

export default async function WorkshopsPage({ searchParams }: WorkshopsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const q = searchParams.q?.trim() ?? ''
  const category = searchParams.category ?? ''

  const [profileResult, workshopsResult] = await Promise.all([
    service.from('profiles').select('membership_status').eq('id', user.id).single(),
    (() => {
      let query = service
        .from('workshops')
        .select('id, slug, title, description, thumbnail_url, duration_minutes, category, constitution_tags, is_members_only, held_on, created_at')
        .eq('is_hidden', false)
        .order('held_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category', category)
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

      return query
    })(),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const workshops = (workshopsResult.data ?? []) as Workshop[]

  const freeWorkshops = workshops.slice(0, FREE_PREVIEW_COUNT)
  const gatedWorkshops = workshops.slice(FREE_PREVIEW_COUNT)

  return (
    <DashboardLayout title="Workshops">
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        <div className="pt-2 space-y-1">
          <h1 className="text-xl font-bold text-text-primary">Workshops</h1>
          <p className="text-sm text-text-secondary">
            Live and recorded TCM wellness sessions with PDF summaries
          </p>
        </div>

        <WorkshopSearch />

        {workshops.length === 0 ? (
          <p className="text-sm text-text-secondary py-8 text-center">
            {q || category ? 'No workshops match your search.' : 'No workshops yet — check back soon.'}
          </p>
        ) : (
          <div className="space-y-3">
            {freeWorkshops.map((ws) => (
              <WorkshopCard key={ws.id} workshop={ws} isMember={isMember} />
            ))}

            {gatedWorkshops.length > 0 && (
              isMember ? (
                gatedWorkshops.map((ws) => (
                  <WorkshopCard key={ws.id} workshop={ws} isMember={isMember} />
                ))
              ) : (
                <MemberGate isMember={false} featureName="full workshop archive">
                  <div className="space-y-3" aria-hidden="true">
                    {gatedWorkshops.slice(0, 2).map((ws) => (
                      <div key={ws.id} className="rounded-sm border border-border bg-surface p-4 opacity-50 blur-[2px]">
                        <p className="font-medium text-text-primary text-sm">{ws.title}</p>
                      </div>
                    ))}
                  </div>
                </MemberGate>
              )
            )}
          </div>
        )}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}

function WorkshopCard({ workshop, isMember }: { workshop: Workshop; isMember: boolean }) {
  const href = workshop.slug ? `/workshops/${workshop.slug}` : null
  const isGated = workshop.is_members_only && !isMember

  const inner = (
    <Card padding="md" className="space-y-2">
      {workshop.thumbnail_url && (
        <div className="rounded-sm overflow-hidden bg-gray-100 aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={workshop.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">{workshop.title}</h2>
        {workshop.is_members_only && (
          <Badge variant="primary" className="shrink-0 text-xs">Members</Badge>
        )}
      </div>

      {workshop.description && (
        <p className="text-xs text-text-secondary line-clamp-2">{workshop.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="muted">{workshop.category}</Badge>
        {workshop.duration_minutes && (
          <span className="text-xs text-text-secondary">{workshop.duration_minutes} min</span>
        )}
        {workshop.held_on && (
          <span className="text-xs text-text-secondary">
            {new Date(workshop.held_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
        {(workshop.constitution_tags as string[]).slice(0, 2).map((tag) => {
          const label = CONSTITUTION_LABELS[tag as keyof typeof CONSTITUTION_LABELS]
          return label ? (
            <Badge key={tag} variant="muted" style={{ color: label.color }}>
              {label.en}
            </Badge>
          ) : null
        })}
      </div>
    </Card>
  )

  if (!href || isGated) return <div>{inner}</div>

  return (
    <Link href={href} className="block hover:opacity-80 transition-opacity duration-200">
      {inner}
    </Link>
  )
}
