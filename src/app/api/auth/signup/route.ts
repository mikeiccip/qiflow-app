import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { signupSchema } from '@/lib/validation/auth'
import { recordConsents, hashIp } from '@/lib/supabase/consent'
import { createReferralRecord } from '@/lib/loyalty/referral'

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F2C1B0"
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const {
    email,
    password,
    full_name,
    date_of_birth,
    age_confirmed,
    terms_accepted,
    health_data_consent,
    marketing_consent,
    referred_by,
  } = parsed.data

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  })

  if (authError || !authData.user) {
    const raw = authError?.message ?? 'Signup failed'
    const isRateLimit = raw.toLowerCase().includes('rate limit') || raw.toLowerCase().includes('email rate')
    const isAlreadyExists = raw.toLowerCase().includes('already')
    const msg = isRateLimit
      ? 'We\'re having trouble sending your confirmation email right now. Please try again in a few minutes.'
      : raw
    const status = isAlreadyExists ? 409 : 400
    return NextResponse.json({ error: msg }, { status })
  }

  const userId = authData.user.id
  const service = createServiceClient()

  // Create profile — upsert in case a trigger already inserted a partial row
  const { error: profileError } = await service.from('profiles').upsert({
    id: userId,
    email,
    full_name,
    date_of_birth,
    marketing_consent,
    health_data_consent,
    referral_code: generateReferralCode(),
  })

  if (profileError) {
    console.error('[signup] profile upsert failed:', profileError.message, profileError.details, profileError.hint)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  // Record GDPR consents (immutable audit trail)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ipHash = ip ? await hashIp(ip) : undefined
  await recordConsents({
    userId,
    consents: { age_confirmed, terms_accepted, health_data_consent, marketing_consent },
    ipHash,
  })

  // Claim referral if provided
  if (referred_by) {
    await createReferralRecord(referred_by, userId).catch(() => {})
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
