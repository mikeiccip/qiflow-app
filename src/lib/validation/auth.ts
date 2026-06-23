import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Please enter your full name'),
  date_of_birth: z.string().optional(),
  age_confirmed: z.boolean().default(false),
  terms_accepted: z.boolean().default(false),
  health_data_consent: z.boolean().default(false),
  marketing_consent: z.boolean().default(false),
  referred_by: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter your password'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
