import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) =>
  resolve(__dirname, '../../src', ...parts)

function readSrc(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Member gate ───────────────────────────────────────────────

describe('Library page', () => {
  it('imports MemberGate', () => {
    const content = readSrc('app/(dashboard)/library/page.tsx')
    expect(content).toContain('MemberGate')
  })

  it('redirects to /login when no user', () => {
    const content = readSrc('app/(dashboard)/library/page.tsx')
    expect(content).toContain("redirect('/login')")
  })
})

// ── HealthDisclaimer ──────────────────────────────────────────

describe('Article page', () => {
  it('renders HealthDisclaimer', () => {
    const content = readSrc('app/(dashboard)/library/[slug]/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })

  it('has generateMetadata export', () => {
    const content = readSrc('app/(dashboard)/library/[slug]/page.tsx')
    expect(content).toContain('generateMetadata')
  })

  it('redirects to /login when no user', () => {
    const content = readSrc('app/(dashboard)/library/[slug]/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('uses marked for markdown rendering', () => {
    const content = readSrc('app/(dashboard)/library/[slug]/page.tsx')
    expect(content).toContain("from 'marked'")
    expect(content).toContain('marked(')
  })

  it('does not render markdown without the marked import (sanitisation gate)', () => {
    const content = readSrc('app/(dashboard)/library/[slug]/page.tsx')
    // dangerouslySetInnerHTML must only be used alongside the marked import
    if (content.includes('dangerouslySetInnerHTML')) {
      expect(content).toContain("from 'marked'")
    }
  })
})

// ── Audio store ───────────────────────────────────────────────

describe('Audio store', () => {
  it('exports play action', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('play(')
  })

  it('exports pause action', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('pause(')
  })

  it('exports seek action', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('seek(')
  })

  it('exports useAudioStore hook', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('useAudioStore')
  })

  it('persists currentTime to sessionStorage', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('sessionStorage')
  })

  it('state has required shape', () => {
    const content = readSrc('lib/audio/store.ts')
    expect(content).toContain('url')
    expect(content).toContain('title')
    expect(content).toContain('isPlaying')
    expect(content).toContain('currentTime')
    expect(content).toContain('duration')
    expect(content).toContain('articleSlug')
  })
})

// ── PersistentAudioPlayer accessibility ──────────────────────

describe('PersistentAudioPlayer', () => {
  it('has aria-label on region', () => {
    const content = readSrc('components/audio/PersistentAudioPlayer.tsx')
    expect(content).toContain('aria-label="Audio player"')
  })

  it('has aria-label on play/pause button', () => {
    const content = readSrc('components/audio/PersistentAudioPlayer.tsx')
    expect(content).toContain('aria-label={store.isPlaying')
  })

  it('has aria-label on seek slider', () => {
    const content = readSrc('components/audio/PersistentAudioPlayer.tsx')
    expect(content).toContain('aria-label="Seek audio position"')
  })

  it('uses role=region', () => {
    const content = readSrc('components/audio/PersistentAudioPlayer.tsx')
    expect(content).toContain('role="region"')
  })
})

// ── Bookmarks API ─────────────────────────────────────────────

describe('Bookmarks API', () => {
  it('POST handler returns bookmarked boolean', () => {
    const content = readSrc('app/api/bookmarks/route.ts')
    expect(content).toContain('bookmarked: false')
    expect(content).toContain('bookmarked: true')
  })

  it('GET handler returns bookmarked_ids array', () => {
    const content = readSrc('app/api/bookmarks/route.ts')
    expect(content).toContain('bookmarked_ids')
  })

  it('requires auth (401 on missing user)', () => {
    const content = readSrc('app/api/bookmarks/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })
})

// ── Bookmarks page ────────────────────────────────────────────

describe('Bookmarks page', () => {
  it('renders HealthDisclaimer', () => {
    const content = readSrc('app/(dashboard)/library/bookmarks/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })

  it('redirects to /login when no user', () => {
    const content = readSrc('app/(dashboard)/library/bookmarks/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('uses ArticleGrid for rendering', () => {
    const content = readSrc('app/(dashboard)/library/bookmarks/page.tsx')
    expect(content).toContain('ArticleGrid')
  })
})

// ── Dashboard layout includes audio player ────────────────────

describe('Dashboard layout', () => {
  it('renders PersistentAudioPlayer', () => {
    const content = readSrc('app/(dashboard)/layout.tsx')
    expect(content).toContain('PersistentAudioPlayer')
  })
})
