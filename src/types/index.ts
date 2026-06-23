// ============================================================
// QiFlow — Core TypeScript Types
// ============================================================

export type MembershipStatus = 'free' | 'member' | 'paused' | 'past_due' | 'cancelled'
export type UserRole = 'member' | 'admin'
export type ContentType = 'article' | 'podcast' | 'video' | 'remedy'
export type ConstitutionType =
  | 'balanced'
  | 'qi_deficiency'
  | 'yang_deficiency'
  | 'yin_deficiency'
  | 'phlegm_dampness'
  | 'damp_heat'
  | 'blood_stasis'
  | 'qi_stagnation'
  | 'special_diathesis'

export const CONSTITUTION_LABELS: Record<ConstitutionType, { en: string; zh: string; color: string }> = {
  balanced:         { en: 'Balanced',         zh: '平和質', color: '#4CAF50' },
  qi_deficiency:    { en: 'Qi Deficiency',    zh: '氣虛質', color: '#FF9800' },
  yang_deficiency:  { en: 'Yang Deficiency',  zh: '陽虛質', color: '#2196F3' },
  yin_deficiency:   { en: 'Yin Deficiency',   zh: '陰虛質', color: '#E91E63' },
  phlegm_dampness:  { en: 'Phlegm-Dampness',  zh: '痰濕質', color: '#9C27B0' },
  damp_heat:        { en: 'Damp-Heat',         zh: '濕熱質', color: '#FF5722' },
  blood_stasis:     { en: 'Blood Stasis',      zh: '血瘀質', color: '#F44336' },
  qi_stagnation:    { en: 'Qi Stagnation',     zh: '氣鬱質', color: '#607D8B' },
  special_diathesis:{ en: 'Special Diathesis', zh: '特稟質', color: '#795548' },
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  membership_status: MembershipStatus
  constitution_primary: ConstitutionType | null
  constitution_secondary: ConstitutionType | null
  stripe_customer_id: string | null
  member_since: string | null
  date_of_birth: string | null
  marketing_consent: boolean
  health_data_consent: boolean
  referral_code: string | null
  referred_by: string | null
  created_at: string
  deleted_at: string | null
}

export interface ConstitutionResult {
  id: string
  user_id: string
  primary_type: ConstitutionType
  secondary_type: ConstitutionType | null
  percentage_match: number
  full_result: ConstitutionAnalysis
  created_at: string
}

export interface ConstitutionAnalysis {
  primary: ConstitutionType
  secondary: ConstitutionType | null
  percentage_match: number
  description: string
  key_symptoms: string[]
  foods_to_eat: string[]
  foods_to_avoid: string[]
  lifestyle_tips: string[]
  suitable_treatments: string[]
}

export interface FoodCheckResult {
  food_identified: string
  suitability: 'great' | 'okay' | 'avoid'
  reason: string
  tcm_properties: string[]
  recommendation: string
  alternatives: string[]
}

export interface SeasonalPlan {
  solar_term_name: string
  solar_term_zh: string
  dates: string
  theme: string
  daily_focus: Array<{
    day: number
    morning_tip: string
    food_tip: string
    evening_tip: string
  }>
  featured_recipe: {
    name: string
    ingredients: string[]
    method: string[]
  }
  acupoint_of_the_week: {
    name: string
    location: string
    benefit: string
    how_to_stimulate: string
  }
}

export interface CheckIn {
  id: string
  user_id: string
  checkin_date: string
  pain: number
  energy: number
  sleep: number
  mood: string
  note: string | null
  created_at: string
}

export interface Content {
  id: string
  slug: string
  title: string
  type: ContentType
  category: string
  season: string | null
  solar_term: string | null
  constitution_tags: ConstitutionType[]
  preview_text: string
  full_content: string | null
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  is_members_only: boolean
  published_at: string
  author: string
  reading_minutes: number | null
  created_at: string
  updated_at: string
}

export interface SolarTerm {
  id: string
  year: number
  term: string
  term_zh: string
  starts_on: string
}


export interface Workshop {
  id: string
  slug: string | null
  title: string
  description: string | null
  video_url: string | null
  pdf_url: string | null
  thumbnail_url: string | null
  duration_minutes: number | null
  category: string
  constitution_tags: ConstitutionType[]
  is_members_only: boolean
  is_hidden: boolean
  held_on: string | null
  created_at: string
}

export const WORKSHOP_CATEGORIES = [
  'general', 'seasonal', 'nutrition', 'movement', 'mindfulness', 'acupressure', 'constitution',
] as const
export type WorkshopCategory = typeof WORKSHOP_CATEGORIES[number]

// Immutable compliance copy — never alter these strings
export const HEALTH_DISCLAIMER =
  'QiFlow supports general wellbeing and is not a substitute for medical diagnosis or treatment. Always consult your GP for medical concerns.'

export const BILLING_PROMISE = '£28/month. No contract. Cancel anytime.'
