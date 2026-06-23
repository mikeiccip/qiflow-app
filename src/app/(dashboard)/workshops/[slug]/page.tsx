import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { Badge, Card, MemberGate, HealthDisclaimer } from '@/components/ui'
import { CONSTITUTION_LABELS, type Workshop } from '@/types'
import { VideoPlayer } from './VideoPlayer'
import Link from 'next/link'

interface WorkshopPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: WorkshopPageProps): Promise<Metadata> {
  const service = createServiceClient()
  const { data } = await service
    .from('workshops')
    .select('title, description')
    .eq('slug', params.slug)
    .eq('is_hidden', false)
    .single()

  if (!data) return { title: 'Workshop' }
  return {
    title: data.title,
    description: data.description ?? undefined,
  }
}

export default async function WorkshopPage({ params }: WorkshopPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [workshopResult, profileResult] = await Promise.all([
    service
      .from('workshops')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_hidden', false)
      .single(),
    service.from('profiles').select('membership_status').eq('id', user.id).single(),
  ])

  if (!workshopResult.data) notFound()

  const workshop = workshopResult.data as Workshop
  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const canWatch = isMember || !workshop.is_members_only

  // Generate signed URL for PDF (1-hour expiry) — only for members
  let pdfSignedUrl: string | null = null
  if (workshop.pdf_url && isMember) {
    const { data: signed } = await service.storage
      .from('workshops')
      .createSignedUrl(workshop.pdf_url, 3600)
    pdfSignedUrl = signed?.signedUrl ?? null
  }

  return (
    <DashboardLayout title={workshop.title}>
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        <div className="pt-2">
          <Link href="/workshops" className="text-xs text-text-secondary hover:text-primary">
            ← All workshops
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">{workshop.title}</h1>
            {workshop.is_members_only && (
              <Badge variant="primary">Members only</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{workshop.category}</Badge>
            {workshop.duration_minutes && (
              <span className="text-xs text-text-secondary">{workshop.duration_minutes} min</span>
            )}
            {workshop.held_on && (
              <span className="text-xs text-text-secondary">
                {new Date(workshop.held_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {(workshop.constitution_tags as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(workshop.constitution_tags as string[]).map((tag) => {
                const label = CONSTITUTION_LABELS[tag as keyof typeof CONSTITUTION_LABELS]
                return label ? (
                  <Badge key={tag} variant="muted" style={{ color: label.color }}>
                    {label.en}
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </div>

        {/* Video section */}
        {canWatch ? (
          workshop.video_url ? (
            <VideoPlayer url={workshop.video_url} title={workshop.title} />
          ) : (
            <Card padding="md">
              <p className="text-sm text-text-secondary text-center py-4">
                Recording coming soon.
              </p>
            </Card>
          )
        ) : (
          <MemberGate isMember={false} featureName="workshop recordings">
            <div className="w-full aspect-video rounded-sm bg-gray-100 flex items-center justify-center opacity-50" aria-hidden="true">
              <span className="text-3xl">▶</span>
            </div>
          </MemberGate>
        )}

        {/* Description */}
        {workshop.description && (
          <p className="text-sm text-text-secondary leading-relaxed">{workshop.description}</p>
        )}

        {/* PDF summary */}
        {workshop.pdf_url && (
          canWatch && pdfSignedUrl ? (
            <a
              href={pdfSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              aria-label="Download PDF summary"
              className="flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors duration-200"
            >
              <span aria-hidden="true">📄</span>
              Download PDF summary
            </a>
          ) : !isMember ? (
            <div className="rounded-sm border border-border bg-surface px-4 py-3 text-sm text-text-secondary opacity-60" aria-label="PDF summary — members only">
              <span aria-hidden="true">📄</span>
              {' '}PDF summary — available to members
            </div>
          ) : null
        )}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
