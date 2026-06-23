import { formatDate } from '@/lib/utils'
import { Badge, Card, EmptyState } from '@/components/ui'
import { UpvoteButton } from './UpvoteButton'

interface Question {
  id: string
  question: string
  category: string
  status: string
  answer: string | null
  upvotes: number
  created_at: string
  answered_at: string | null
}

interface QuestionListProps {
  questions: Question[]
  showStatus?: boolean
}

export function QuestionList({ questions, showStatus = false }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title="No questions yet"
        description="Be the first to ask — answered questions are shared with all members."
      />
    )
  }

  return (
    <div className="space-y-3" role="list" aria-label="Community questions">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} showStatus={showStatus} />
      ))}
    </div>
  )
}

function QuestionCard({ question: q, showStatus }: { question: Question; showStatus: boolean }) {
  return (
    <Card padding="md" role="listitem">
      <div className="space-y-2">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="muted">{q.category}</Badge>
          {showStatus && (
            <Badge
              variant={
                q.status === 'answered' ? 'success'
                : q.status === 'hidden' ? 'error'
                : 'warning'
              }
            >
              {q.status}
            </Badge>
          )}
          <span className="text-xs text-text-secondary ml-auto">
            {formatDate(q.created_at, { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Question */}
        <p className="text-sm font-medium text-text-primary leading-snug">{q.question}</p>

        {/* Answer */}
        {q.answer && (
          <div className="bg-primary-light border-l-2 border-primary rounded-r-btn pl-3 pr-2 py-2 space-y-1">
            <p className="text-xs font-semibold text-primary">Practitioner answer</p>
            <p className="text-sm text-text-primary leading-relaxed">{q.answer}</p>
            {q.answered_at && (
              <p className="text-xs text-text-secondary">
                {formatDate(q.answered_at, { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        {q.status === 'answered' && (
          <div className="flex items-center justify-end pt-1">
            <UpvoteButton questionId={q.id} initialCount={q.upvotes} />
          </div>
        )}
      </div>
    </Card>
  )
}
