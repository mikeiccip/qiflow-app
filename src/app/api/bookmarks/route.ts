import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()
  const { content_id } = body
  if (!content_id || typeof content_id !== 'string') {
    return NextResponse.json({ error: 'content_id required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check if bookmark exists
  const { data: existing } = await service
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_id', content_id)
    .maybeSingle()

  if (existing) {
    await service.from('bookmarks').delete().eq('id', existing.id)
    return NextResponse.json({ bookmarked: false })
  }

  await service.from('bookmarks').insert({ user_id: user.id, content_id })
  return NextResponse.json({ bookmarked: true })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data } = await service
    .from('bookmarks')
    .select('content_id')
    .eq('user_id', user.id)

  const ids = (data ?? []).map((b: { content_id: string }) => b.content_id)
  return NextResponse.json({ bookmarked_ids: ids })
}
