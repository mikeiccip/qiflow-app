import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/cron/cleanup
 * Protected by CRON_SECRET header.
 * Scheduled via vercel.json — runs at 03:00 UTC daily.
 * Purges analytics events older than 90 days to keep the table lean.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffIso = cutoff.toISOString()

  const { error } = await service
    .from('analytics_events')
    .delete()
    .lt('created_at', cutoffIso)

  return NextResponse.json({
    ok: !error,
    error: error?.message,
    purged_before: cutoffIso,
  })
}
