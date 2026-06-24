import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferralStats } from '@/lib/loyalty/referral'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const stats = await getReferralStats(user.id)
  if (!stats) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json(stats)
}
