import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { HealthDisclaimer } from '@/components/ui'
import { ArticleGrid } from '../ArticleGrid'
import { type Content } from '@/types'

export const metadata: Metadata = {
  title: 'My Bookmarks',
  description: 'Your saved articles and TCM content, ready to revisit.',
}

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: bookmarks } = await service
    .from('bookmarks')
    .select('content_id')
    .eq('user_id', user.id)

  const contentIds = (bookmarks ?? []).map((b: { content_id: string }) => b.content_id)

  let articles: Content[] = []
  if (contentIds.length > 0) {
    const { data } = await service
      .from('content')
      .select('*')
      .in('id', contentIds)
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
    articles = data ?? []
  }

  return (
    <DashboardLayout title="My Bookmarks">
      <div className="max-w-lg mx-auto space-y-4 pb-8">
        <ArticleGrid
          articles={articles}
          bookmarkedIds={contentIds}
          emptyMessage="No bookmarks yet — tap the bookmark icon on any article to save it for later."
        />
        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
