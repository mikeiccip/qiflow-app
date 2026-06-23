'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface UpvoteButtonProps {
  questionId: string
  initialCount: number
}

export function UpvoteButton({ questionId, initialCount }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [upvoted, setUpvoted] = useState(false)

  async function handleUpvote() {
    if (upvoted || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/community/upvote/${questionId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setCount(data.upvotes ?? count + 1)
        setUpvoted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={upvoted || loading}
      aria-label={upvoted ? `Upvoted — ${count} upvotes` : `Upvote — ${count} upvotes`}
      aria-pressed={upvoted}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-btn text-xs font-medium transition-colors',
        'min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        upvoted
          ? 'text-primary bg-primary-light'
          : 'text-text-secondary border border-gray-200 hover:border-primary hover:text-primary',
        (upvoted || loading) && 'cursor-default'
      )}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      {count}
    </button>
  )
}
