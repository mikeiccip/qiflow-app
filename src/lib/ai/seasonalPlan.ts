/**
 * Seasonal plan generation + cache layer.
 * Server-side only — never import in client components.
 *
 * Cache contract: generate ONCE per (user_id, solar_term) pair.
 * Never regenerate on re-view — the unique DB constraint enforces this.
 */

import { callClaude, AI_MODELS } from './claude'
import { seasonalPlanSchema, type SeasonalPlanOutput } from './schemas'
import { createServiceClient } from '@/lib/supabase/service'
import { type ConstitutionType, CONSTITUTION_LABELS } from '@/types'

// ── UK timezone helpers ───────────────────────────────────────

export function todayUK(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
}

export async function getCurrentSolarTerm(): Promise<{
  term: string
  term_zh: string
  starts_on: string
} | null> {
  const service = createServiceClient()
  const today = todayUK()

  const { data } = await service
    .from('solar_terms')
    .select('term, term_zh, starts_on')
    .lte('starts_on', today)
    .order('starts_on', { ascending: false })
    .limit(1)
    .single()

  return data ?? null
}

export async function getNextSolarTermDate(currentStartsOn: string): Promise<string | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('solar_terms')
    .select('starts_on')
    .gt('starts_on', currentStartsOn)
    .order('starts_on', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.starts_on ?? null
}

// ── Cache read ────────────────────────────────────────────────

export async function getCachedPlan(
  userId: string,
  solarTerm: string
): Promise<SeasonalPlanOutput | null> {
  const service = createServiceClient()
  const { data } = await service
    .from('seasonal_plans')
    .select('plan')
    .eq('user_id', userId)
    .eq('solar_term', solarTerm)
    .maybeSingle()

  if (!data) return null

  const parsed = seasonalPlanSchema.safeParse(data.plan)
  return parsed.success ? parsed.data : null
}

// ── Generation ────────────────────────────────────────────────

const SEASONAL_PLAN_FALLBACK: SeasonalPlanOutput = {
  solar_term_name: 'Current Solar Term',
  solar_term_zh: '節氣',
  dates: 'This fortnight',
  theme: 'Nourish your wellbeing with the seasonal rhythm of Traditional Chinese Medicine.',
  daily_focus: Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    morning_tip: 'Begin your day with warm water and gentle movement to support your Qi.',
    food_tip: 'Choose warm, easily digestible foods that suit the current season.',
    evening_tip: 'Wind down early; restful sleep supports your body\'s natural restoration.',
  })),
  featured_recipe: {
    name: 'Warming Ginger Congee',
    ingredients: ['1 cup jasmine rice', '6 cups water', '3 slices fresh ginger', 'Salt to taste'],
    method: [
      'Bring water and ginger to a boil, add rice and reduce to a simmer.',
      'Cook uncovered, stirring occasionally, for 45–60 minutes until porridge-like.',
      'Season lightly and serve warm with your choice of toppings.',
    ],
  },
  acupoint_of_the_week: {
    name: 'ST36 — Zusanli (足三里)',
    location: 'Four finger-widths below the kneecap, one finger-width to the outside of the shinbone.',
    benefit: 'Traditionally used to support digestive wellbeing and general vitality.',
    how_to_stimulate: 'Apply gentle circular pressure with your thumb for 1–2 minutes on each leg.',
  },
}

export async function generateSeasonalPlan(
  userId: string,
  solarTerm: { term: string; term_zh: string; starts_on: string },
  nextTermDate: string | null,
  constitution: ConstitutionType | null
): Promise<SeasonalPlanOutput> {
  const constitutionLabel = constitution
    ? `${CONSTITUTION_LABELS[constitution].en} (${CONSTITUTION_LABELS[constitution].zh})`
    : 'Balanced (平和質) — constitution not yet identified, use general balanced-type guidance'

  const dateRange = nextTermDate
    ? `${solarTerm.starts_on} to ${nextTermDate}`
    : `from ${solarTerm.starts_on}`

  const systemPrompt = `You are a Traditional Chinese Medicine wellness educator.
You create seasonal wellness plans based on the TCM solar-term calendar, tailored to an individual's body constitution.

Your plans must:
- Use TCM principles to offer practical daily guidance appropriate for the season
- Phrase all guidance as "traditionally used for", "may support", "some people find helpful" — NEVER as medical fact
- Include only safe, broadly applicable suggestions (food, gentle movement, lifestyle rhythm)
- Avoid any diagnostic language or claims to treat/cure/heal conditions
- Write warmly and accessibly for a UK audience unfamiliar with TCM
- All recipe ingredients must be available in UK supermarkets`

  const userMessage = `Create a 7-day seasonal wellness plan for the solar term: ${solarTerm.term} (${solarTerm.term_zh}), covering ${dateRange}.

The member's TCM body constitution is: ${constitutionLabel}.

Generate a personalised plan with:
- A seasonal theme that connects TCM wisdom to this specific solar term
- 7 days of morning tips, food tips, and evening tips tailored to both the season and constitution
- One featured recipe using ingredients available in UK supermarkets
- One acupoint of the week with clear location and stimulation instructions

Remember: phrased as wellbeing support, not medical treatment.`

  const result = await callClaude({
    model: AI_MODELS.quality,
    systemPrompt,
    userMessage,
    tool: {
      name: 'generate_seasonal_plan',
      description: 'Generate a personalised TCM seasonal wellness plan.',
      inputSchema: SEASONAL_PLAN_TOOL_SCHEMA,
    },
    outputSchema: seasonalPlanSchema,
    fallback: SEASONAL_PLAN_FALLBACK,
    maxTokens: 3000,
    taskLabel: 'seasonal_plan',
  })

  // Cache the result (fallback or real)
  const service = createServiceClient()
  await service
    .from('seasonal_plans')
    .upsert(
      {
        user_id: userId,
        solar_term: solarTerm.term,
        constitution_type: constitution ?? 'balanced',
        plan: result.data,
      },
      { onConflict: 'user_id,solar_term', ignoreDuplicates: true }
    )

  return result.data
}

// ── Main entry point ──────────────────────────────────────────

export async function getOrGenerateSeasonalPlan(
  userId: string,
  constitution: ConstitutionType | null
): Promise<{
  plan: SeasonalPlanOutput
  currentTerm: { term: string; term_zh: string; starts_on: string } | null
  fromCache: boolean
}> {
  const currentTerm = await getCurrentSolarTerm()

  if (!currentTerm) {
    return { plan: SEASONAL_PLAN_FALLBACK, currentTerm: null, fromCache: false }
  }

  const cached = await getCachedPlan(userId, currentTerm.term)
  if (cached) {
    return { plan: cached, currentTerm, fromCache: true }
  }

  const nextDate = await getNextSolarTermDate(currentTerm.starts_on)
  const plan = await generateSeasonalPlan(userId, currentTerm, nextDate, constitution)
  return { plan, currentTerm, fromCache: false }
}

// ── Tool JSON Schema ──────────────────────────────────────────

const SEASONAL_PLAN_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    solar_term_name: { type: 'string', description: 'English name of the solar term' },
    solar_term_zh: { type: 'string', description: 'Chinese name of the solar term' },
    dates: { type: 'string', description: 'Date range covered (e.g. "21 June – 7 July 2026")' },
    theme: { type: 'string', description: 'Seasonal wellness theme, 10-200 characters' },
    daily_focus: {
      type: 'array',
      description: 'Exactly 7 daily focus objects',
      items: {
        type: 'object',
        properties: {
          day: { type: 'integer', minimum: 1, maximum: 7 },
          morning_tip: { type: 'string', description: '10-150 characters' },
          food_tip: { type: 'string', description: '10-150 characters' },
          evening_tip: { type: 'string', description: '10-150 characters' },
        },
        required: ['day', 'morning_tip', 'food_tip', 'evening_tip'],
      },
      minItems: 7,
      maxItems: 7,
    },
    featured_recipe: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        ingredients: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 10 },
        method: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: 'Exactly 3 cooking steps',
        },
      },
      required: ['name', 'ingredients', 'method'],
    },
    acupoint_of_the_week: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        location: { type: 'string', description: '10-150 characters' },
        benefit: { type: 'string', description: '10-150 characters, phrased as "traditionally used for / may support"' },
        how_to_stimulate: { type: 'string', description: '10-200 characters' },
      },
      required: ['name', 'location', 'benefit', 'how_to_stimulate'],
    },
  },
  required: ['solar_term_name', 'solar_term_zh', 'dates', 'theme', 'daily_focus', 'featured_recipe', 'acupoint_of_the_week'],
} as const
