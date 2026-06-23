import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushToUser } from '@/lib/push/send'

/**
 * POST /api/cron/checkin-reminder
 * Protected by CRON_SECRET header.
 * Scheduled via vercel.json — runs at 20:00 UK time (UTC during BST = 19:00, GMT = 20:00).
 * Sends a push notification to members who haven't checked in today.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  // Today in UK timezone (YYYY-MM-DD)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())

  // Find members with a push subscription who haven't checked in today
  const { data: subscribers } = await service
    .from('push_subscriptions')
    .select('user_id')
    .order('user_id')

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Get user_ids that already checked in today
  const allUserIds = [...new Set(subscribers.map((s) => s.user_id as string))]

  const { data: checkedIn } = await service
    .from('checkins')
    .select('user_id')
    .in('user_id', allUserIds)
    .eq('checkin_date', today)

  const checkedInSet = new Set((checkedIn ?? []).map((c) => c.user_id as string))

  // Only notify members who haven't checked in and are active members
  const { data: activeMembers } = await service
    .from('profiles')
    .select('id')
    .in('id', allUserIds)
    .in('membership_status', ['member'])
    .is('deleted_at', null)

  const activeMemberSet = new Set((activeMembers ?? []).map((p) => p.id as string))

  const toNotify = allUserIds.filter(
    (id) => !checkedInSet.has(id) && activeMemberSet.has(id)
  )

  let sent = 0
  const payload = {
    title: 'QiFlow daily check-in 🌿',
    body: 'How are you feeling today? Log your energy, sleep, and mood.',
    url: '/progress/log',
  }

  await Promise.all(
    toNotify.map(async (userId) => {
      try {
        await sendPushToUser(userId, payload)
        sent++
      } catch (err) {
        console.error('[checkin-reminder] push failed for', userId, err)
      }
    })
  )

  return NextResponse.json({ ok: true, sent, skipped: allUserIds.length - toNotify.length })
}
