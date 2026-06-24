import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { MemberGate, HealthDisclaimer } from '@/components/ui'
import { LibraryFilters } from './LibraryFilters'
import { ArticleGrid } from './ArticleGrid'
import { type Content, type ConstitutionType } from '@/types'

export const metadata: Metadata = {
  title: 'Knowledge Library',
  description: 'Browse TCM articles, podcasts, and remedies personalised to your constitution.',
}

interface LibraryPageProps {
  searchParams: { category?: string; constitution?: string }
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [profileResult, contentResult, bookmarkResult] = await Promise.all([
    service
      .from('profiles')
      .select('membership_status')
      .eq('id', user.id)
      .single(),
    service
      .from('content')
      .select('*')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false }),
    service
      .from('bookmarks')
      .select('content_id')
      .eq('user_id', user.id),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const bookmarkedIds = (bookmarkResult.data ?? []).map((b: { content_id: string }) => b.content_id)

  let articles: Content[] = contentResult.data ?? []

  // Server-side filter by category
  if (searchParams.category && searchParams.category !== 'All') {
    articles = articles.filter((a) => a.category === searchParams.category)
  }

  // Server-side filter by constitution
  if (searchParams.constitution) {
    articles = articles.filter((a) =>
      a.constitution_tags.includes(searchParams.constitution as ConstitutionType)
    )
  }

  const freeArticles = articles.slice(0, 3)
  const gatedArticles = articles.slice(3)

  return (
    <DashboardLayout title="Knowledge Library" headerRight={
      <a
        href="/library/bookmarks"
        aria-label="View bookmarks"
        className="text-text-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
      >
        <BookmarkIcon />
      </a>
    }>
      <div className="max-w-lg mx-auto space-y-4 pb-8">
        <Suspense fallback={null}>
          <LibraryFilters />
        </Suspense>

        <ArticleGrid articles={freeArticles} bookmarkedIds={bookmarkedIds} />

        {gatedArticles.length > 0 && (
          isMember ? (
            <ArticleGrid articles={gatedArticles} bookmarkedIds={bookmarkedIds} />
          ) : (
            <MemberGate isMember={false} featureName="Full Knowledge Library">
              <ArticleGrid articles={gatedArticles} bookmarkedIds={[]} />
            </MemberGate>
          )
        )}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
    </svg>
  )
}
