import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Auth guard ────────────────────────────────────────────────

describe('Community page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/community/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('renders MemberGate for non-members', () => {
    const content = read('app/(dashboard)/community/page.tsx')
    expect(content).toContain('MemberGate')
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/community/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })

  it('displays remaining question quota', () => {
    const content = read('app/(dashboard)/community/page.tsx')
    expect(content).toContain('capResult.remaining')
    expect(content).toContain('PostQuestionForm')
  })
})

// ── Question submission API ───────────────────────────────────

describe('Community questions API (POST)', () => {
  it('returns 401 without auth', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('returns 403 for non-members', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('403')
    expect(content).toContain('Membership required')
  })

  it('enforces monthly cap via checkAndIncrementCap', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('checkAndIncrementCap')
    expect(content).toContain("'community_question'")
  })

  it('returns 429 when cap is reached', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('429')
    expect(content).toContain('Monthly question limit reached')
  })

  it('runs moderation before storage', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('moderateText')
    expect(content).toContain('moderation.safe')
  })

  it('sanitises input before storage', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('sanitiseUserInput')
  })

  it('blocks on moderation failure (422)', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('422')
  })

  it('generates AI draft after insert', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('generateQADraft')
    expect(content).toContain('ai_draft')
  })

  it('validates question max 300 chars', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('max(300)')
  })

  it('validates category as enum', () => {
    const content = read('app/api/community/questions/route.ts')
    expect(content).toContain('QA_CATEGORIES')
    expect(content).toContain('z.enum')
  })
})

// ── AI draft generation ───────────────────────────────────────

describe('qaAnswerDraft', () => {
  it('uses Haiku (fast) model not Sonnet', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).toContain('AI_MODELS.fast')
    expect(content).not.toContain('AI_MODELS.quality')
  })

  it('sanitises input before passing to Claude', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).toContain('sanitiseUserInput')
  })

  it('wraps question in user_content tag (injection defence)', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).toContain('<user_content>')
  })

  it('ASA guard — prompt does not claim to treat or cure', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).not.toContain('"treats"')
    expect(content).not.toContain('"cures"')
    expect(content).toContain('may support')
  })

  it('draft label explicitly says never auto-published', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).toContain('never auto-published')
  })

  it('exports generateQADraft', () => {
    const content = read('lib/ai/qaAnswerDraft.ts')
    expect(content).toContain('export async function generateQADraft')
  })
})

// ── Admin Q&A gate ────────────────────────────────────────────

describe('Admin QA API', () => {
  it('GET returns 401 without auth', () => {
    const content = read('app/api/admin/qa/route.ts')
    expect(content).toContain('401')
  })

  it('GET returns 403 for non-admin', () => {
    const content = read('app/api/admin/qa/route.ts')
    expect(content).toContain('403')
    expect(content).toContain("role !== 'admin'")
  })

  it('GET only returns pending questions', () => {
    const content = read('app/api/admin/qa/route.ts')
    expect(content).toContain("'pending'")
  })

  it('GET selects ai_draft column', () => {
    const content = read('app/api/admin/qa/route.ts')
    expect(content).toContain('ai_draft')
  })
})

describe('Admin answer route', () => {
  it('checks admin role', () => {
    const content = read('app/api/admin/qa/[id]/answer/route.ts')
    expect(content).toContain('assertAdmin')
    expect(content).toContain('403')
  })

  it('sets status to answered on publish', () => {
    const content = read('app/api/admin/qa/[id]/answer/route.ts')
    expect(content).toContain("status: 'answered'")
    expect(content).toContain('answered_at')
    expect(content).toContain('answered_by')
  })

  it('validates answer min 10 chars', () => {
    const content = read('app/api/admin/qa/[id]/answer/route.ts')
    expect(content).toContain('min(10)')
  })
})

describe('Admin hide route', () => {
  it('checks admin role', () => {
    const content = read('app/api/admin/qa/[id]/hide/route.ts')
    expect(content).toContain("role !== 'admin'")
    expect(content).toContain('403')
  })

  it("sets status to 'hidden'", () => {
    const content = read('app/api/admin/qa/[id]/hide/route.ts')
    expect(content).toContain("status: 'hidden'")
  })
})

// ── Admin UI — draft visibility ───────────────────────────────

describe('AnswerForm (admin UI)', () => {
  it('labels AI draft as practitioner eyes only', () => {
    const content = read('app/admin/qa/AnswerForm.tsx')
    expect(content).toContain('practitioner eyes only')
  })

  it('labels draft as never auto-published', () => {
    const content = read('app/admin/qa/AnswerForm.tsx')
    expect(content).toContain('never auto-published')
  })

  it('strips practitioner notes before populating answer field', () => {
    const content = read('app/admin/qa/AnswerForm.tsx')
    expect(content).toContain('Practitioner note')
    expect(content).toContain('cleanDraft')
  })

  it('has Publish answer and Hide question actions', () => {
    const content = read('app/admin/qa/AnswerForm.tsx')
    expect(content).toContain('Publish answer')
    expect(content).toContain('Hide question')
  })
})

// ── Post form ─────────────────────────────────────────────────

describe('PostQuestionForm', () => {
  it('enforces 300 char max client-side', () => {
    const content = read('app/(dashboard)/community/PostQuestionForm.tsx')
    expect(content).toContain('maxLength={300}')
    expect(content).toContain('300 - question.length')
  })

  it('shows remaining monthly quota', () => {
    const content = read('app/(dashboard)/community/PostQuestionForm.tsx')
    expect(content).toContain('remainingAfter')
  })

  it('has accessible form label', () => {
    const content = read('app/(dashboard)/community/PostQuestionForm.tsx')
    expect(content).toContain('aria-label="Submit a wellness question"')
  })

  it('has category selector', () => {
    const content = read('app/(dashboard)/community/PostQuestionForm.tsx')
    expect(content).toContain('qa-category')
    expect(content).toContain('QA_CATEGORIES')
  })

  it('shows submitted confirmation state', () => {
    const content = read('app/(dashboard)/community/PostQuestionForm.tsx')
    expect(content).toContain('submitted')
    expect(content).toContain('Question submitted!')
  })
})

// ── Upvote button ─────────────────────────────────────────────

describe('UpvoteButton', () => {
  it('has aria-pressed state', () => {
    const content = read('app/(dashboard)/community/UpvoteButton.tsx')
    expect(content).toContain('aria-pressed={upvoted}')
  })

  it('has aria-label with count', () => {
    const content = read('app/(dashboard)/community/UpvoteButton.tsx')
    expect(content).toContain('aria-label={upvoted ?')
  })

  it('calls upvote API endpoint', () => {
    const content = read('app/(dashboard)/community/UpvoteButton.tsx')
    expect(content).toContain('/api/community/upvote/')
  })

  it('prevents double-upvote', () => {
    const content = read('app/(dashboard)/community/UpvoteButton.tsx')
    expect(content).toContain('upvoted || loading')
  })
})
