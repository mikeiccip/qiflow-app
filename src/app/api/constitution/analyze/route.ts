import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { callClaude, AI_MODELS } from '@/lib/ai/claude'
import { constitutionAnalysisSchema } from '@/lib/ai/schemas'
import { z } from 'zod'

const bodySchema = z.object({
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
})

const FALLBACK_ANALYSIS = {
  primary: 'balanced' as const,
  secondary: null,
  percentage_match: 60,
  description: 'Your responses suggest a generally balanced constitution. This is a positive foundation — focus on maintaining regular routines, balanced nutrition, and adequate rest.',
  key_symptoms: ['Generally good energy levels', 'Balanced digestion', 'Adapts well to seasonal changes', 'Stable mood', 'Good sleep quality'],
  foods_to_eat: ['Seasonal vegetables', 'Whole grains', 'Lean proteins', 'Warming soups', 'Moderate fruit', 'Fermented foods'],
  foods_to_avoid: ['Processed foods', 'Excessive sugar', 'Very cold drinks', 'Alcohol in excess', 'Late-night eating', 'Greasy takeaways'],
  lifestyle_tips: ['Maintain consistent sleep and wake times', 'Exercise moderately 3–4 times per week', 'Eat meals at regular times each day', 'Spend time outdoors each day'],
  suitable_treatments: ['Seasonal acupuncture tune-ups', 'Relaxing Tui Na massage', 'Qi Gong or Tai Chi'],
}

const CONSTITUTION_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    primary: {
      type: 'string',
      enum: ['balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency', 'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation', 'special_diathesis'],
      description: 'The dominant TCM constitution type',
    },
    secondary: {
      type: 'string',
      enum: ['balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency', 'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation', 'special_diathesis'],
      nullable: true,
      description: 'A secondary constitution type if clearly present, otherwise null',
    },
    percentage_match: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Confidence percentage for the primary constitution match',
    },
    description: { type: 'string', description: '2–4 sentences describing this constitution in accessible terms, 20–800 characters' },
    key_symptoms: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5, description: 'Exactly 5 common characteristics of this constitution' },
    foods_to_eat: { type: 'array', items: { type: 'string' }, minItems: 6, maxItems: 6, description: 'Exactly 6 foods or food types that benefit this constitution' },
    foods_to_avoid: { type: 'array', items: { type: 'string' }, minItems: 6, maxItems: 6, description: 'Exactly 6 foods or food types to reduce for this constitution' },
    lifestyle_tips: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4, description: 'Exactly 4 lifestyle recommendations' },
    suitable_treatments: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3, description: 'Exactly 3 TCM treatments or practices' },
  },
  required: ['primary', 'secondary', 'percentage_match', 'description', 'key_symptoms', 'foods_to_eat', 'foods_to_avoid', 'lifestyle_tips', 'suitable_treatments'],
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })

  const { answers } = parsed.data

  const answerSummary = Object.entries(answers)
    .map(([q, score]) => `${q}: ${score}/5`)
    .join('\n')

  const { data: result } = await callClaude({
    model: AI_MODELS.fast,
    systemPrompt: `You are an expert Traditional Chinese Medicine (TCM) practitioner analysing a constitution questionnaire.
Based on the user's responses (scored 1–5, where 1=Never and 5=Always), identify their primary TCM body constitution.
The 9 constitution types are: Balanced (平和質), Qi Deficiency (氣虛質), Yang Deficiency (陽虛質), Yin Deficiency (陰虛質), Phlegm-Dampness (痰濕質), Damp-Heat (濕熱質), Blood Stasis (血瘀質), Qi Stagnation (氣鬱質), Special Diathesis (特稟質).
Write warmly and accessibly for a UK audience. Never use diagnostic or medical language — frame everything as "traditionally associated with" or "may support".`,
    userMessage: `Please analyse these constitution questionnaire responses and identify the primary TCM constitution:\n\n${answerSummary}`,
    tool: {
      name: 'analyse_constitution',
      description: 'Analyse TCM constitution questionnaire responses and return a structured result.',
      inputSchema: CONSTITUTION_TOOL_SCHEMA,
    },
    outputSchema: constitutionAnalysisSchema,
    fallback: FALLBACK_ANALYSIS,
    maxTokens: 1500,
  })

  const service = createServiceClient()

  // Save to constitution_results
  await service.from('constitution_results').insert({
    user_id: user.id,
    primary_type: result.primary,
    secondary_type: result.secondary,
    percentage_match: result.percentage_match,
    full_result: result,
  })

  // Update profile with primary constitution
  await service.from('profiles').update({
    constitution_primary: result.primary,
    constitution_secondary: result.secondary,
  }).eq('id', user.id)

  return NextResponse.json({ result })
}
