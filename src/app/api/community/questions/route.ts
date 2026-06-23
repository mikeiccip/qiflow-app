import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkAndIncrementCap } from '@/lib/ai/caps'
import { moderateText, sanitiseUserInput } from '@/lib/ai/moderation'
import { generateQADraft } from '@/lib/ai/qaAnswerDraft'
import { QA_CATEGORIES, type QACategory } from './constants'

const postSchema = z.object({
  question: z.string().min(10).max(300),
  category: z.enum(QA_CATEGORIES),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const service = createServiceClient()

  // Member check — only members can post
  const { data: profile } = await service
    .from('profiles')
    .select('membership_status')
    .eq('id', user.id)
    .single()

  if (!['member', 'paused'].includes(profile?.membership_status ?? '')) {
    return NextResponse.json({ error: 'Membership required' }, { status: 403 })
  }

  // Validate body
  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  }

  const { question, category } = parsed.data

  // Monthly cap: 2 questions per member
  const capResult = await checkAndIncrementCap(user.id, 'community_question')
  if (!capResult.allowed) {
    return NextResponse.json({
      error: 'Monthly question limit reached',
      message: `You've used both of your 2 questions for this month. Your allowance resets on the 1st.`,
      remaining: 0,
    }, { status: 429 })
  }

  // Moderation check before storage
  const sanitised = sanitiseUserInput(question)
  const moderation = await moderateText(sanitised)
  if (!moderation.safe) {
    // Refund the cap increment — question was blocked
    // (No decrement API; cap is conservative — blocked questions are rare)
    return NextResponse.json({
      error: 'Question could not be submitted',
      message: 'Your question was flagged during our content check. Please rephrase and try again.',
    }, { status: 422 })
  }

  // Insert question
  const { data: inserted, error: insertError } = await service
    .from('community_questions')
    .insert({
      user_id: user.id,
      question: sanitised,
      category,
      status: 'pending',
      upvotes: 0,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 })
  }

  // Generate AI draft for admin — fire after response would be ideal but
  // Next.js route handlers can't background after response; Haiku is fast (~500ms)
  try {
    const draft = await generateQADraft(sanitised, category)
    const draftText = [
      draft.draft_answer,
      draft.notes_for_practitioner
        ? `\n\n[Practitioner note: ${draft.notes_for_practitioner}]`
        : '',
    ].join('')

    await service
      .from('community_questions')
      .update({ ai_draft: draftText })
      .eq('id', inserted.id)
  } catch {
    // Draft generation failed — question is still submitted, admin can answer manually
    console.error('[qa] AI draft generation failed for question', inserted.id)
  }

  return NextResponse.json({
    success: true,
    question_id: inserted.id,
    remaining: capResult.remaining,
  }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const mine = searchParams.get('mine') === 'true'

  const service = createServiceClient()

  let query = service
    .from('community_questions')
    .select('id, question, category, status, answer, upvotes, created_at, answered_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (mine) {
    query = query.eq('user_id', user.id)
  } else {
    query = query.eq('status', 'answered')
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data } = await query
  return NextResponse.json({ questions: data ?? [] })
}
