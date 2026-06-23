'use client'

import { useRef, useState } from 'react'

interface VideoPlayerProps {
  url: string
  title: string
}

function getYouTubeId(url: string): string | null {
  // Handles youtube.com/watch?v= and youtu.be/ short URLs
  if (url.includes('youtu.be/')) {
    const afterDomain = url.split('youtu.be/')[1]
    return afterDomain?.split('?')[0]?.slice(0, 11) ?? null
  }
  const m = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  const ytId = getYouTubeId(url)
  const vimeoId = getVimeoId(url)

  if (ytId) {
    return (
      <div className="relative w-full aspect-video rounded-sm overflow-hidden bg-black">
        <iframe
          title={title}
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-sm overflow-hidden bg-black">
        <iframe
          title={title}
          src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full aspect-video rounded-sm bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-text-secondary">Video could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-sm overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={url}
        aria-label={`Workshop video: ${title}`}
        controls
        preload="metadata"
        className="w-full aspect-video"
        onError={() => setError(true)}
      >
        Your browser does not support the video element.
      </video>
    </div>
  )
}
