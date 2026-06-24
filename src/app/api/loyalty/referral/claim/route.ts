import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createReferralRecord } from '@/lib/loyalty/referral'

const claimSchema = z.object({
  referral_code: z.string().min(1).max(20),
})

/**
 * Called during onboarding when a new user arrives via a referral link.
 * The user must be authenticated (just signed up).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const parsed = claimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
  }

  const result = await createReferralRecord(parsed.data.referral_code, user.id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
