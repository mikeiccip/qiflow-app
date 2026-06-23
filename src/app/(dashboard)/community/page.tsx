import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout'
import { HealthDisclaimer, MemberGate } from '@/components/ui'
import { getCapStatus } from '@/lib/ai/caps'
import { PostQuestionForm } from './PostQuestionForm'
import { QuestionList } from './QuestionList'

export const metadata: Metadata = {
  title: 'Community Q&A',
  description: 'Ask TCM wellness questions and read practitioner-reviewed answers.',
}

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [profileResult, answeredResult, myQuestionsResult, capResult] = await Promise.all([
    service.from('profiles').select('membership_status').eq('id', user.id).single(),
    service
      .from('community_questions')
      .select('id, question, category, status, answer, upvotes, created_at, answered_at')
      .eq('status', 'answered')
      .order('upvotes', { ascending: false })
      .order('answered_at', { ascending: false })
      .limit(30),
    service
      .from('community_questions')
      .select('id, question, category, status, answer, upvotes, created_at, answered_at')
      .eq('user_id', user.id)
      .neq('status', 'answered')
      .order('created_at', { ascending: false }),
    getCapStatus(user.id, 'community_question'),
  ])

  const isMember = ['member', 'paused'].includes(profileResult.data?.membership_status ?? '')
  const answeredQuestions = answeredResult.data ?? []
  const myPendingQuestions = myQuestionsResult.data ?? []

  return (
    <DashboardLayout title="Community Q&A">
      <div className="max-w-lg mx-auto space-y-5 pb-8">

        <div className="pt-2 space-y-1">
          <h1 className="text-xl font-bold text-text-primary">Ask a Question</h1>
          <p className="text-sm text-text-secondary">
            Members post wellness questions · answered by our TCM practitioner
          </p>
        </div>

        {isMember ? (
          <>
            <PostQuestionForm remaining={capResult.remaining} />

            {/* My pending questions */}
            {myPendingQuestions.length > 0 && (
              <section aria-label="Your pending questions">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Your pending questions
                </h2>
                <QuestionList questions={myPendingQuestions} showStatus />
              </section>
            )}

            {/* Answered board */}
            <section aria-label="Answered questions">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Answered questions
              </h2>
              <QuestionList questions={answeredQuestions} />
            </section>
          </>
        ) : (
          <>
            <MemberGate isMember={false} featureName="Community Q&A">
              <div className="h-48 bg-gray-50 rounded-card" aria-hidden="true" />
            </MemberGate>

            {/* Non-members can still see answered questions */}
            {answeredQuestions.length > 0 && (
              <section aria-label="Answered questions">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Answered questions
                </h2>
                <QuestionList questions={answeredQuestions.slice(0, 3)} />
              </section>
            )}
          </>
        )}

        <HealthDisclaimer compact />
      </div>
    </DashboardLayout>
  )
}
