'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore, audioActions } from '@/lib/audio/store'
import { cn } from '@/lib/utils'

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function PersistentAudioPlayer() {
  const store = useAudioStore()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el || !store.url) return
    if (el.src !== store.url) {
      el.src = store.url
      el.currentTime = store.currentTime
    }
    if (store.isPlaying) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [store.url, store.isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore seek position when url changes
  useEffect(() => {
    const el = audioRef.current
    if (!el || !store.url) return
    const onLoaded = () => {
      if (store.currentTime > 0) el.currentTime = store.currentTime
    }
    el.addEventListener('loadedmetadata', onLoaded)
    return () => el.removeEventListener('loadedmetadata', onLoaded)
  }, [store.url]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!store.url) return null

  return (
    <section
      role="region"
      aria-label="Audio player"
      className={cn(
        'fixed left-0 right-0 z-40',
        'bottom-[calc(4rem+env(safe-area-inset-bottom))]',
        'bg-surface border-t border-gray-200 px-4 py-2',
        'flex items-center gap-3 shadow-card-hover'
      )}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const el = audioRef.current
          if (el) audioActions.setCurrentTime(el.currentTime)
        }}
        onLoadedMetadata={() => {
          const el = audioRef.current
          if (el) audioActions.setDuration(el.duration)
        }}
        onEnded={() => audioActions.pause()}
        aria-hidden="true"
      />

      {/* Title */}
      <p className="flex-1 text-xs font-medium text-text-primary truncate min-w-0">
        {store.title}
      </p>

      {/* Play / Pause */}
      <button
        aria-label={store.isPlaying ? 'Pause audio' : 'Play audio'}
        onClick={() => (store.isPlaying ? audioActions.pause() : audioActions.resume())}
        className={cn(
          'shrink-0 w-11 h-11 rounded-full bg-primary text-white',
          'flex items-center justify-center',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'transition-colors hover:bg-primary-dark'
        )}
      >
        {store.isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Seek slider + times */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-text-secondary tabular-nums w-8 text-right" aria-live="off">
          {formatTime(store.currentTime)}
        </span>
        <input
          type="range"
          aria-label="Seek audio position"
          min={0}
          max={store.duration || 100}
          value={store.currentTime}
          step={1}
          onChange={(e) => {
            const t = Number(e.target.value)
            audioActions.seek(t)
            if (audioRef.current) audioRef.current.currentTime = t
          }}
          className="w-24 accent-primary focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-xs text-text-secondary tabular-nums w-8">
          {formatTime(store.duration)}
        </span>
      </div>
    </section>
  )
}
