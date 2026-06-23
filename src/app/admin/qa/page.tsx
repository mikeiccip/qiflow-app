'use client'

import { useEffect, useState } from 'react'
import { Badge, Card, EmptyState } from '@/components/ui'
import { AnswerForm } from './AnswerForm'
import { formatDate } from '@/lib/utils'

interface AdminQuestion {
  id: string
  question: string
  category: string
  status: string
  ai_draft: string | null
  upvotes: number
  created_at: string
}

export default function AdminQAPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/qa')
      .then((r) => {
        if (r.status === 403) throw new Error('Admin access required')
        return r.json()
      })
      .then((data) => setQuestions(data.questions ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">Loading Q&A queue…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Q&amp;A Queue</h1>
        <p className="text-sm text-text-secondary mt-1">
          {questions.length} pending question{questions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon="✅" title="Queue clear" description="No pending questions to answer." />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id} padding="md">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="muted">{q.category}</Badge>
                  <Badge variant="warning">{q.status}</Badge>
                  <span className="text-xs text-text-secondary ml-auto">
                    {formatDate(q.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm font-medium text-text-primary">{q.question}</p>

                <AnswerForm
                  questionId={q.id}
                  aiDraft={q.ai_draft}
                  onAnswered={removeQuestion}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
