'use client'

import { useEffect } from 'react'
import { audioActions } from '@/lib/audio/store'
import { Button } from '@/components/ui'

interface AudioPlayerInitProps {
  url: string
  title: string
  slug: string
  durationMinutes: number | null
}

export function AudioPlayerInit({ url, title, slug, durationMinutes }: AudioPlayerInitProps) {
  // Restore play state if this article was last playing
  useEffect(() => {
    // Don't auto-play; user must tap play explicitly
  }, [])

  return (
    <div className="bg-primary-light border border-primary/20 rounded-card px-4 py-3 flex items-center gap-3">
      <span aria-hidden="true" className="text-2xl">🎧</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{title}</p>
        {durationMinutes && (
          <p className="text-xs text-text-secondary">{durationMinutes} min listen</p>
        )}
      </div>
      <Button
        variant="primary"
        size="sm"
        aria-label={`Play audio for ${title}`}
        onClick={() => audioActions.play(url, title, slug)}
      >
        Play
      </Button>
    </div>
  )
}
