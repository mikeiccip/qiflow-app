'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  contentId: string
  initialBookmarked: boolean
}

export function BookmarkButton({ contentId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      })
      if (res.ok) {
        const data = await res.json()
        setBookmarked(data.bookmarked)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-medium',
        'min-h-[44px] min-w-[44px] transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        bookmarked
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'border border-primary text-primary bg-transparent hover:bg-primary-light'
      )}
    >
      {bookmarked ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
        </svg>
      )}
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  )
}
