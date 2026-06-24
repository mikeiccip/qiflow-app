import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const ALLOWED_PROPERTY_KEYS = [
  'content_id', 'content_type', 'source', 'constitution',
  'milestone', 'solar_term', 'category', 'count', 'from', 'slug',
]

const bodySchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: true })
    }

    const { event, properties = {} } = parsed.data
    const safe: Record<string, unknown> = {}
    for (const key of ALLOWED_PROPERTY_KEYS) {
      if (key in properties) safe[key] = properties[key]
    }

    const service = createServiceClient()
    await service.from('analytics_events').insert({
      user_id: user.id,
      event_name: event.slice(0, 100),
      properties: safe,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
