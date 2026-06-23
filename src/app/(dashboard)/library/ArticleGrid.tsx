import Link from 'next/link'
import { EmptyState } from '@/components/ui'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type Content, type ConstitutionType } from '@/types'

interface ArticleGridProps {
  articles: Content[]
  bookmarkedIds?: string[]
  emptyMessage?: string
}

export function ArticleGrid({ articles, bookmarkedIds = [], emptyMessage }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="No articles found"
        description={emptyMessage ?? 'Try adjusting your filters to find relevant content.'}
      />
    )
  }

  return (
    <div className="grid gap-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isBookmarked={bookmarkedIds.includes(article.id)}
        />
      ))}
    </div>
  )
}

function ArticleCard({ article, isBookmarked }: { article: Content; isBookmarked: boolean }) {
  const visibleTags = article.constitution_tags.slice(0, 2)
  const overflowCount = article.constitution_tags.length - 2

  return (
    <Link
      href={`/library/${article.slug}`}
      className={cn(
        'block bg-surface rounded-card shadow-card border-l-2 border-primary',
        'px-4 py-3 space-y-2',
        'transition-shadow duration-150 hover:shadow-card-hover',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
      )}
      aria-label={`Read: ${article.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary leading-snug flex-1">{article.title}</h3>
        {isBookmarked && (
          <span aria-label="Bookmarked" className="text-primary shrink-0 mt-0.5">
            <BookmarkFilledIcon />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="default">{article.category}</Badge>
        {visibleTags.map((tag) => (
          <Badge key={tag} variant="constitution" constitution={tag as ConstitutionType} />
        ))}
        {overflowCount > 0 && (
          <Badge variant="muted">+{overflowCount}</Badge>
        )}
        {article.audio_url && (
          <Badge variant="muted">
            <span aria-label="Has audio">🎧</span>
            {article.reading_minutes ? ` ${article.reading_minutes} min` : ' Audio'}
          </Badge>
        )}
        {!article.audio_url && article.reading_minutes && (
          <Badge variant="muted">{article.reading_minutes} min read</Badge>
        )}
      </div>
    </Link>
  )
}

function BookmarkFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
    </svg>
  )
}
