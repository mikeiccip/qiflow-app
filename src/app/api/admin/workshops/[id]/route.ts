import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { WORKSHOP_CATEGORIES } from '@/types'

async function assertAdmin(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'admin'
}

const patchSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  pdf_url: z.string().max(500).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  duration_minutes: z.number().int().min(1).max(600).nullable().optional(),
  category: z.enum(WORKSHOP_CATEGORIES).optional(),
  constitution_tags: z.array(z.string()).optional(),
  is_members_only: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  held_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isAdmin = await assertAdmin(user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('workshops')
    .update(parsed.data)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isAdmin = await assertAdmin(user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service
    .from('workshops')
    .update({ is_hidden: true })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
