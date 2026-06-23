import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category') ?? ''
  const includeHidden = searchParams.get('include_hidden') === 'true'

  const service = createServiceClient()

  // Verify admin if include_hidden requested
  if (includeHidden) {
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  let query = service
    .from('workshops')
    .select('id, slug, title, description, thumbnail_url, duration_minutes, category, constitution_tags, is_members_only, is_hidden, held_on, created_at')
    .order('held_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (!includeHidden) query = query.eq('is_hidden', false)
  if (category) query = query.eq('category', category)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workshops: data ?? [] })
}
