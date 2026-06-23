import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { checkAndAwardMilestones } from '@/lib/loyalty/milestones'
import { track } from '@/lib/analytics/track'

const checkinSchema = z.object({
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pain: z.number().int().min(0).max(10),
  energy: z.number().int().min(0).max(10),
  sleep: z.number().int().min(0).max(10),
  mood: z.enum(['😢', '😕', '😐', '😊', '😄']),
  note: z.string().max(500).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const parsed = checkinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })
  }

  const { checkin_date, pain, energy, sleep, mood, note } = parsed.data
  const service = createServiceClient()

  // Upsert — DB has unique(user_id, checkin_date)
  const { data, error } = await service
    .from('checkins')
    .upsert(
      { user_id: user.id, checkin_date, pain, energy, sleep, mood, note: note ?? null },
      { onConflict: 'user_id,checkin_date' }
    )
    .select('id, checkin_date')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  // Fire-and-forget — do not block the response
  checkAndAwardMilestones(user.id).catch(() => {})
  track(user.id, 'check_in', { content_type: 'checkin' }).catch(() => {})

  return NextResponse.json({ checkin: data }, { status: 200 })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)))

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceDate = since.toISOString().split('T')[0]

  const service = createServiceClient()
  const { data } = await service
    .from('checkins')
    .select('id, checkin_date, pain, energy, sleep, mood, note, created_at')
    .eq('user_id', user.id)
    .gte('checkin_date', sinceDate)
    .order('checkin_date', { ascending: true })

  return NextResponse.json({ checkins: data ?? [] })
}
