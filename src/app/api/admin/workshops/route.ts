import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { WORKSHOP_CATEGORIES } from '@/types'

const workshopSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  pdf_url: z.string().max(500).optional(),  // Supabase Storage path
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  duration_minutes: z.number().int().min(1).max(600).optional(),
  category: z.enum(WORKSHOP_CATEGORIES),
  constitution_tags: z.array(z.string()).default([]),
  is_members_only: z.boolean().default(true),
  held_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

async function assertAdmin(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'admin'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isAdmin = await assertAdmin(user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const parsed = workshopSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('workshops')
    .insert({
      ...parsed.data,
      video_url: parsed.data.video_url || null,
      pdf_url: parsed.data.pdf_url || null,
      thumbnail_url: parsed.data.thumbnail_url || null,
      held_on: parsed.data.held_on || null,
      description: parsed.data.description || null,
    })
    .select('id, slug')
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'A workshop with this slug already exists' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ workshop: data }, { status: 201 })
}
