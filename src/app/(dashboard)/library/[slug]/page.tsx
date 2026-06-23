import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { marked } from 'marked'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { Badge, MemberGate, HealthDisclaimer } from '@/components/ui'
import { CONSTITUTION_LABELS, type ConstitutionType } from '@/types'
import { AudioPlayerInit } from './AudioPlayerInit'
import { BookmarkButton } from './BookmarkButton'

interface ArticlePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const service = createServiceClient()
  const { data } = await service
    .from('content')
    .select('title, preview_text')
    .eq('slug', params.slug)
    .single()

  if (!data) return { title: 'Article' }

  return {
    title: data.title,
    description: data.preview_text?.slice(0, 160) ?? '',
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Fetch article first so we have the id for the bookmark query
  const { data: article } = await service
    .from('content')
    .select('*')
    .eq('slug', params.slug)
    .not('published_at', 'is', null)
    .single()

  if (!article) notFound()

  const [profileResult, bookmarkResult] = await Promise.all([
    service
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single(),
    service
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', article.id)
      .maybeSingle(),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const isBookmarked = !!bookmarkResult.data
  const canReadFull = isMember || !article.is_members_only

  // marked is used with content from our own database — not user-generated input
  const htmlContent = article.full_content
    ? (marked(article.full_content, { async: false }) as string)
    : null

  return (
    <DashboardLayout title="Library">
      <article className="max-w-lg mx-auto pb-8 space-y-4">
        {/* Header */}
        <header className="space-y-2 pt-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">{article.category}</Badge>
            {(article.constitution_tags as ConstitutionType[]).map((tag) => (
              <Badge key={tag} variant="constitution" constitution={tag} />
            ))}
          </div>
          <h1 className="text-xl font-bold text-text-primary leading-snug">{article.title}</h1>
          {article.reading_minutes && (
            <p className="text-xs text-text-secondary">
              {article.audio_url
                ? `${article.reading_minutes} min listen`
                : `${article.reading_minutes} min read`}
            </p>
          )}
        </header>

        {/* Bookmark */}
        <BookmarkButton contentId={article.id} initialBookmarked={isBookmarked} />

        {/* Audio section */}
        {article.audio_url && (
          <AudioPlayerInit
            url={article.audio_url}
            title={article.title}
            slug={article.slug}
            durationMinutes={article.reading_minutes}
          />
        )}

        {/* Body content */}
        {canReadFull ? (
          htmlContent ? (
            <div
              className="prose prose-sm max-w-none
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:text-text-primary
                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:text-text-primary
                [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-text-primary
                [&_ul]:text-sm [&_ul]:space-y-1 [&_ul]:pl-4
                [&_li]:text-text-primary [&_li]:list-disc
                [&_strong]:font-semibold [&_strong]:text-text-primary"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <p className="text-sm text-text-primary leading-relaxed">{article.preview_text}</p>
          )
        ) : (
          <>
            <p className="text-sm text-text-primary leading-relaxed">{article.preview_text}</p>
            <MemberGate isMember={false} featureName="Full article">
              <div className="h-32 bg-gray-50 rounded-card" aria-hidden="true" />
            </MemberGate>
          </>
        )}

        <HealthDisclaimer />
      </article>
    </DashboardLayout>
  )
}
