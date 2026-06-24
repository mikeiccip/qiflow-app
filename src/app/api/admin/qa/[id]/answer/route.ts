import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const answerSchema = z.object({
  answer: z.string().min(10).max(2000),
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isAdmin = await assertAdmin(user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const parsed = answerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid answer' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('community_questions')
    .update({
      answer: parsed.data.answer,
      answered_by: user.id,
      answered_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', params.id)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: 'Failed to publish answer' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
