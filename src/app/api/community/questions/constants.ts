export const QA_CATEGORIES = [
  'General Wellbeing',
  'Nutrition & Food',
  'Seasonal Health',
  'Constitution & Body Type',
  'Sleep & Rest',
  'Energy & Vitality',
  'Digestion',
  'Emotional Wellbeing',
] as const

export type QACategory = typeof QA_CATEGORIES[number]
