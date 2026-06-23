import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'Question ID required' }, { status: 400 })

  const service = createServiceClient()

  // Only allow upvoting answered questions
  const { data: question } = await service
    .from('community_questions')
    .select('id, upvotes, status')
    .eq('id', id)
    .eq('status', 'answered')
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const { data: updated } = await service
    .from('community_questions')
    .update({ upvotes: (question.upvotes ?? 0) + 1 })
    .eq('id', id)
    .select('upvotes')
    .single()

  return NextResponse.json({ upvotes: updated?.upvotes ?? question.upvotes + 1 })
}
