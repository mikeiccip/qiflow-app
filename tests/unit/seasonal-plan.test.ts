import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Auth + member gate ────────────────────────────────────────

describe('Seasonal plan page', () => {
  it('redirects to /login when no user', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain("redirect('/login')")
  })

  it('renders MemberGate for non-members', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('MemberGate')
    expect(content).toContain('isMember')
  })

  it('renders HealthDisclaimer', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('HealthDisclaimer')
  })

  it('uses getOrGenerateSeasonalPlan', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('getOrGenerateSeasonalPlan')
  })

  it('renders DayCards with daily_focus data', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('DayCards')
    expect(content).toContain('daily_focus')
  })

  it('renders featured_recipe section', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('featured_recipe')
    expect(content).toContain('Featured Recipe')
  })

  it('renders acupoint section', () => {
    const content = read('app/(dashboard)/seasonal-plan/page.tsx')
    expect(content).toContain('acupoint_of_the_week')
    expect(content).toContain('Acupoint of the Week')
  })
})

// ── Solar term detection ──────────────────────────────────────

describe('seasonalPlan lib', () => {
  it('exports getOrGenerateSeasonalPlan', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('export async function getOrGenerateSeasonalPlan')
  })

  it('exports getCurrentSolarTerm', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('export async function getCurrentSolarTerm')
  })

  it('uses UK timezone for date detection', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('Europe/London')
  })

  it('reads from solar_terms table not hardcoded dates', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain("from('solar_terms')")
    // Must NOT hardcode all 24 dates
    expect(content).not.toContain("'2026-03-20'")
    expect(content).not.toContain("'2026-06-21'")
  })

  it('checks cache before generating', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('getCachedPlan')
    expect(content).toContain('seasonal_plans')
  })

  it('caches on (user_id, solar_term) with ignoreDuplicates', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('user_id,solar_term')
    expect(content).toContain('ignoreDuplicates')
  })

  it('uses claude-sonnet-4-6 (quality model) not haiku', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('AI_MODELS.quality')
    // Must not use fast/haiku model
    expect(content).not.toContain('AI_MODELS.fast')
  })

  it('maxTokens is sufficient for a full plan (>= 2000)', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    // 3000 tokens specified
    expect(content).toMatch(/maxTokens.*[23]\d{3}/)
  })

  it('exports todayUK helper', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('export function todayUK')
  })

  it('has a fallback plan for when generation fails', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('SEASONAL_PLAN_FALLBACK')
  })

  it('fallback plan has 7 days', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('length: 7')
  })

  it('ASA guard — benefit phrased as "traditionally used for"', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    expect(content).toContain('traditionally used for')
  })

  it('ASA guard — no "treats" or "cures" in prompts', () => {
    const content = read('lib/ai/seasonalPlan.ts')
    // These words must not appear in prompt templates as claims
    expect(content).not.toContain('"treats"')
    expect(content).not.toContain('"cures"')
    expect(content).not.toContain('"heals"')
  })
})

// ── Day cards ─────────────────────────────────────────────────

describe('DayCards', () => {
  it('is a client component', () => {
    const content = read('app/(dashboard)/seasonal-plan/DayCards.tsx')
    expect(content).toContain("'use client'")
  })

  it('uses CSS scroll snap for swiping', () => {
    const content = read('app/(dashboard)/seasonal-plan/DayCards.tsx')
    expect(content).toContain('snap-x')
    expect(content).toContain('snap-start')
  })

  it('has ARIA tablist pattern', () => {
    const content = read('app/(dashboard)/seasonal-plan/DayCards.tsx')
    expect(content).toContain('role="tablist"')
    expect(content).toContain('role="tab"')
    expect(content).toContain('role="tabpanel"')
  })

  it('has accessible section label', () => {
    const content = read('app/(dashboard)/seasonal-plan/DayCards.tsx')
    expect(content).toContain('aria-label="Daily focus cards"')
  })

  it('renders morning, food, and evening tips', () => {
    const content = read('app/(dashboard)/seasonal-plan/DayCards.tsx')
    expect(content).toContain('morning_tip')
    expect(content).toContain('food_tip')
    expect(content).toContain('evening_tip')
  })
})

// ── Seasonal plan schema already tested in ai-service.test.ts ─
// These just confirm the schema export is present

describe('seasonalPlanSchema', () => {
  it('is exported from schemas', () => {
    const content = read('lib/ai/schemas.ts')
    expect(content).toContain('seasonalPlanSchema')
  })

  it('requires exactly 7 daily_focus items', () => {
    const content = read('lib/ai/schemas.ts')
    expect(content).toContain('.length(7)')
  })

  it('requires exactly 3 method steps', () => {
    const content = read('lib/ai/schemas.ts')
    expect(content).toContain('.length(3)')
  })
})
