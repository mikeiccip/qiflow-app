import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMilestoneStatuses, checkAndAwardMilestones } from '@/lib/loyalty/milestones'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const statuses = await getMilestoneStatuses(user.id)
  return NextResponse.json({ milestones: statuses })
}

/**
 * POST — trigger a milestone check for the authenticated user.
 * Called server-to-server (from checkin route, Stripe webhook, etc.).
 * Returns newly awarded milestone keys.
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const newMilestones = await checkAndAwardMilestones(user.id)
  return NextResponse.json({ awarded: newMilestones })
}
