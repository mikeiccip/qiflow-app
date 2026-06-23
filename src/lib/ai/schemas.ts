/**
 * Zod schemas for all AI tool-use outputs.
 * These are the contracts between callClaude() and the application.
 * Every schema has a corresponding JSON Schema in the tool definition.
 */

import { z } from 'zod'

// ── Constitution Analysis ──────────────────────────────────────
export const constitutionAnalysisSchema = z.object({
  primary: z.enum([
    'balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency',
    'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation', 'special_diathesis',
  ]),
  secondary: z.enum([
    'balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency',
    'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation', 'special_diathesis',
  ]).nullable(),
  percentage_match: z.number().int().min(0).max(100),
  description: z.string().min(20).max(800),
  key_symptoms: z.array(z.string()).length(5),
  foods_to_eat: z.array(z.string()).length(6),
  foods_to_avoid: z.array(z.string()).length(6),
  lifestyle_tips: z.array(z.string()).length(4),
  suitable_treatments: z.array(z.string()).length(3),
})

export type ConstitutionAnalysisOutput = z.infer<typeof constitutionAnalysisSchema>

// ── Food Check ────────────────────────────────────────────────
export const foodCheckSchema = z.object({
  identified_food: z.string().min(1).max(200),
  thermal_nature: z.enum(['hot', 'warm', 'neutral', 'cool', 'cold']),
  taste_profile: z.array(z.enum(['sweet', 'sour', 'bitter', 'pungent', 'salty'])),
  suitability: z.enum(['excellent', 'good', 'neutral', 'caution', 'avoid']),
  suitability_reason: z.string().min(10).max(400),
  tips: z.array(z.string().min(5).max(300)).min(1).max(3),
  cautions: z.string().max(400),
  constitution_match: z.string().max(400),
})

export type FoodCheckOutput = z.infer<typeof foodCheckSchema>

// ── Seasonal Plan ─────────────────────────────────────────────
export const seasonalPlanSchema = z.object({
  solar_term_name: z.string().min(1),
  solar_term_zh: z.string().min(1),
  dates: z.string().min(1),
  theme: z.string().min(10).max(200),
  daily_focus: z.array(z.object({
    day: z.number().int().min(1).max(7),
    morning_tip: z.string().min(10).max(150),
    food_tip: z.string().min(10).max(150),
    evening_tip: z.string().min(10).max(150),
  })).length(7),
  featured_recipe: z.object({
    name: z.string().min(1).max(100),
    ingredients: z.array(z.string()).min(2).max(10),
    method: z.array(z.string()).length(3),
  }),
  acupoint_of_the_week: z.object({
    name: z.string().min(1).max(50),
    location: z.string().min(10).max(150),
    benefit: z.string().min(10).max(150),
    how_to_stimulate: z.string().min(10).max(200),
  }),
})

export type SeasonalPlanOutput = z.infer<typeof seasonalPlanSchema>

// ── Community Q&A Draft ───────────────────────────────────────
export const qaAnswerDraftSchema = z.object({
  draft_answer: z.string().min(20).max(600),
  confidence: z.enum(['high', 'medium', 'low']),
  notes_for_practitioner: z.string().max(300).optional(),
})

export type QAAnswerDraftOutput = z.infer<typeof qaAnswerDraftSchema>

// ── Fallback values ───────────────────────────────────────────
export const CONSTITUTION_ANALYSIS_FALLBACK: ConstitutionAnalysisOutput = {
  primary: 'balanced',
  secondary: null,
  percentage_match: 0,
  description: 'We were unable to complete your constitution analysis. Please try again.',
  key_symptoms: ['Please retake the quiz', 'Result unavailable', '', '', ''],
  foods_to_eat: ['Please retake the quiz', '', '', '', '', ''],
  foods_to_avoid: ['Please retake the quiz', '', '', '', '', ''],
  lifestyle_tips: ['Please retake the quiz', '', '', ''],
  suitable_treatments: ['Please retake the quiz', '', ''],
}

export const FOOD_CHECK_FALLBACK: FoodCheckOutput = {
  identified_food: 'Unable to identify',
  thermal_nature: 'neutral',
  taste_profile: [],
  suitability: 'neutral',
  suitability_reason: 'We were unable to analyse this image. Please try again with a clearer photo.',
  tips: ['Try again with better lighting or describe the food in the note field.'],
  cautions: '',
  constitution_match: '',
}

export const QA_DRAFT_FALLBACK: QAAnswerDraftOutput = {
  draft_answer: 'Unable to generate draft. Please compose your answer manually.',
  confidence: 'low',
}
