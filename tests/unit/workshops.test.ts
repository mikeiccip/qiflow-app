import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Types ──────────────────────────────────────────────────────

describe('Workshop type + constants', () => {
  it('exports Workshop interface', () => {
    const content = read('types/index.ts')
    expect(content).toContain('export interface Workshop')
    expect(content).toContain('slug: string | null')
    expect(content).toContain('pdf_url: string | null')
    expect(content).toContain('is_members_only: boolean')
    expect(content).toContain('is_hidden: boolean')
  })

  it('exports WORKSHOP_CATEGORIES', () => {
    const content = read('types/index.ts')
    expect(content).toContain('export const WORKSHOP_CATEGORIES')
    expect(content).toContain("'general'")
    expect(content).toContain("'seasonal'")
    expect(content).toContain("'acupressure'")
  })
})

// ── Migration ─────────────────────────────────────────────────

describe('Migration 005', () => {
  it('adds is_members_only and is_hidden columns', () => {
    const content = readFileSync(
      resolve(__dirname, '../../supabase/migrations/005_workshops_extend.sql'),
      'utf-8'
    )
    expect(content).toContain('is_members_only')
    expect(content).toContain('is_hidden')
    expect(content).toContain('slug')
    expect(content).toContain('duration_minutes')
    expect(content).toContain('constitution_tags')
  })

  it('creates workshops Storage bucket', () => {
    const content = readFileSync(
      resolve(__dirname, '../../supabase/migrations/005_workshops_extend.sql'),
      'utf-8'
    )
    expect(content).toContain("storage.buckets")
    expect(content).toContain("'workshops'")
    expect(content).toContain('public, false')
  })
})

// ── List API ───────────────────────────────────────────────────

describe('Workshops list API (GET)', () => {
  it('returns 401 without auth', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('filters out hidden workshops by default', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain("eq('is_hidden', false)")
  })

  it('supports ?q= text search', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain("searchParams.get('q')")
    expect(content).toContain('ilike')
  })

  it('supports ?category= filter', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain("searchParams.get('category')")
  })

  it('requires admin for include_hidden=true', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain('include_hidden')
    expect(content).toContain("role !== 'admin'")
    expect(content).toContain('403')
  })

  it('orders by held_on descending', () => {
    const content = read('app/api/workshops/route.ts')
    expect(content).toContain('held_on')
    expect(content).toContain('ascending: false')
  })
})

// ── Admin create API ──────────────────────────────────────────

describe('Admin workshops create (POST)', () => {
  it('checks admin role', () => {
    const content = read('app/api/admin/workshops/route.ts')
    expect(content).toContain('assertAdmin')
    expect(content).toContain('403')
  })

  it('validates slug format', () => {
    const content = read('app/api/admin/workshops/route.ts')
    expect(content).toContain('slug')
    expect(content).toContain('regex')
    expect(content).toContain('[a-z0-9-]')
  })

  it('validates category against enum', () => {
    const content = read('app/api/admin/workshops/route.ts')
    expect(content).toContain('WORKSHOP_CATEGORIES')
    expect(content).toContain('z.enum')
  })

  it('returns 409/400 on duplicate slug', () => {
    const content = read('app/api/admin/workshops/route.ts')
    expect(content).toContain('23505')
    expect(content).toContain('slug already exists')
  })

  it('returns 401 without auth', () => {
    const content = read('app/api/admin/workshops/route.ts')
    expect(content).toContain('401')
  })
})

// ── PDF upload API ────────────────────────────────────────────

describe('Admin PDF upload (POST)', () => {
  it('returns 401 without auth', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain('401')
  })

  it('checks admin role', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain("role !== 'admin'")
    expect(content).toContain('403')
  })

  it('rejects non-PDF files (415)', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain('application/pdf')
    expect(content).toContain('415')
  })

  it('enforces 20 MB file size limit (413)', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain('MAX_PDF_BYTES')
    expect(content).toContain('413')
  })

  it('uploads to workshops Storage bucket', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain("from('workshops')")
    expect(content).toContain('.upload(')
    expect(content).toContain("'application/pdf'")
  })

  it('returns path (not a signed URL) for the creator', () => {
    const content = read('app/api/admin/workshops/upload/route.ts')
    expect(content).toContain('{ path }')
  })
})

// ── Admin update/hide API ─────────────────────────────────────

describe('Admin workshops update/hide', () => {
  it('PATCH checks admin role', () => {
    const content = read('app/api/admin/workshops/[id]/route.ts')
    expect(content).toContain('PATCH')
    expect(content).toContain('assertAdmin')
    expect(content).toContain('403')
  })

  it('DELETE soft-hides (sets is_hidden = true)', () => {
    const content = read('app/api/admin/workshops/[id]/route.ts')
    expect(content).toContain('DELETE')
    expect(content).toContain('is_hidden: true')
    expect(content).not.toContain('.delete(')
  })

  it('PATCH can set is_hidden = false (unhide)', () => {
    const content = read('app/api/admin/workshops/[id]/route.ts')
    expect(content).toContain('is_hidden')
    expect(content).toContain('z.boolean')
  })
})

// ── Dashboard archive page ────────────────────────────────────

describe('Workshops archive page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/workshops/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('shows MemberGate for gated workshops', () => {
    const content = read('app/(dashboard)/workshops/page.tsx')
    expect(content).toContain('MemberGate')
    expect(content).toContain('FREE_PREVIEW_COUNT')
  })

  it('reads q and category from searchParams', () => {
    const content = read('app/(dashboard)/workshops/page.tsx')
    expect(content).toContain('searchParams.q')
    expect(content).toContain('searchParams.category')
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/workshops/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })

  it('uses service client for data (bypasses RLS)', () => {
    const content = read('app/(dashboard)/workshops/page.tsx')
    expect(content).toContain('createServiceClient')
  })
})

// ── Detail page ───────────────────────────────────────────────

describe('Workshop detail page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('calls notFound when workshop missing', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('notFound()')
  })

  it('generates signed PDF URL server-side (1 hour expiry)', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('createSignedUrl')
    expect(content).toContain('3600')
  })

  it('signed URL only generated for members', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('isMember')
    expect(content).toContain('pdfSignedUrl')
  })

  it('has generateMetadata export', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('generateMetadata')
  })

  it('member gate on video player', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('canWatch')
    expect(content).toContain('MemberGate')
  })

  it('download link has aria-label', () => {
    const content = read('app/(dashboard)/workshops/[slug]/page.tsx')
    expect(content).toContain('aria-label="Download PDF summary"')
    expect(content).toContain('download')
  })
})

// ── VideoPlayer component ─────────────────────────────────────

describe('VideoPlayer', () => {
  it('detects YouTube URLs and uses embed iframe', () => {
    const content = read('app/(dashboard)/workshops/[slug]/VideoPlayer.tsx')
    expect(content).toContain('getYouTubeId')
    expect(content).toContain('youtube.com/embed/')
    expect(content).toContain('youtu.be')
  })

  it('detects Vimeo URLs and uses embed iframe', () => {
    const content = read('app/(dashboard)/workshops/[slug]/VideoPlayer.tsx')
    expect(content).toContain('getVimeoId')
    expect(content).toContain('player.vimeo.com/video/')
  })

  it('falls back to native video element', () => {
    const content = read('app/(dashboard)/workshops/[slug]/VideoPlayer.tsx')
    expect(content).toContain('<video')
    expect(content).toContain('controls')
    expect(content).toContain('preload="metadata"')
  })

  it('iframes have title attribute (accessibility)', () => {
    const content = read('app/(dashboard)/workshops/[slug]/VideoPlayer.tsx')
    const iframeCount = (content.match(/<iframe/g) ?? []).length
    const titleCount = (content.match(/title={title}/g) ?? []).length
    expect(iframeCount).toBeGreaterThan(0)
    expect(titleCount).toBe(iframeCount)
  })

  it('handles video load errors gracefully', () => {
    const content = read('app/(dashboard)/workshops/[slug]/VideoPlayer.tsx')
    expect(content).toContain('onError')
    expect(content).toContain('setError(true)')
  })
})

// ── WorkshopSearch ────────────────────────────────────────────

describe('WorkshopSearch', () => {
  it('is a client component', () => {
    const content = read('app/(dashboard)/workshops/WorkshopSearch.tsx')
    expect(content).toContain("'use client'")
  })

  it('has aria-label on search input', () => {
    const content = read('app/(dashboard)/workshops/WorkshopSearch.tsx')
    expect(content).toContain('aria-label="Search workshops"')
  })

  it('has aria-label on category select', () => {
    const content = read('app/(dashboard)/workshops/WorkshopSearch.tsx')
    expect(content).toContain('aria-label="Filter by category"')
  })

  it('uses router.push with scroll:false for URL update', () => {
    const content = read('app/(dashboard)/workshops/WorkshopSearch.tsx')
    expect(content).toContain('scroll: false')
    expect(content).toContain('router.push')
  })

  it('renders WORKSHOP_CATEGORIES in dropdown', () => {
    const content = read('app/(dashboard)/workshops/WorkshopSearch.tsx')
    expect(content).toContain('WORKSHOP_CATEGORIES')
  })
})

// ── Admin UploadForm ──────────────────────────────────────────

describe('UploadForm (admin)', () => {
  it('auto-generates slug from title', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('slugify')
    expect(content).toContain('handleTitleChange')
  })

  it('uploads PDF before creating record', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('/api/admin/workshops/upload')
    expect(content).toContain('/api/admin/workshops')
    const uploadIdx = content.indexOf('/api/admin/workshops/upload')
    const createIdx = content.indexOf("method: 'POST',\n        headers")
    expect(uploadIdx).toBeLessThan(createIdx)
  })

  it('validates PDF file type client-side (accept attribute)', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('accept="application/pdf"')
  })

  it('has aria-label on upload form', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('aria-label="Upload workshop"')
  })

  it('shows error with role=alert', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('role="alert"')
  })

  it('has members-only checkbox', () => {
    const content = read('app/admin/workshops/UploadForm.tsx')
    expect(content).toContain('isMembersOnly')
    expect(content).toContain('Members only')
  })
})
