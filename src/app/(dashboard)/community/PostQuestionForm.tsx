'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { QA_CATEGORIES, type QACategory } from '@/app/api/community/questions/constants'

interface PostQuestionFormProps {
  remaining: number
}

export function PostQuestionForm({ remaining }: PostQuestionFormProps) {
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<QACategory>('General Wellbeing')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingAfter, setRemainingAfter] = useState(remaining)

  const charsLeft = 300 - question.length
  const canSubmit = question.trim().length >= 10 && remainingAfter > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/community/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), category }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Could not submit question. Please try again.')
        return
      }

      setSubmitted(true)
      setRemainingAfter(data.remaining ?? 0)
      setQuestion('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (remainingAfter === 0 && !submitted) {
    return (
      <Card padding="md" className="bg-primary-light border border-primary/20">
        <p className="text-sm font-medium text-primary">Monthly question limit reached</p>
        <p className="text-xs text-text-secondary mt-1">
          You&rsquo;ve used both questions for this month. Your allowance resets on the 1st.
        </p>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card padding="md" className="bg-success/10 border border-success/30">
        <p className="text-sm font-semibold text-success">Question submitted!</p>
        <p className="text-xs text-text-secondary mt-1">
          Our practitioner will review and answer it shortly.
          {remainingAfter > 0
            ? ` You have ${remainingAfter} question${remainingAfter !== 1 ? 's' : ''} remaining this month.`
            : ' You have used all your questions for this month.'}
        </p>
        {remainingAfter > 0 && (
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs text-primary underline mt-2 focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Ask another question
          </button>
        )}
      </Card>
    )
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Ask a question</h2>
        <span className="text-xs text-text-secondary">
          {remainingAfter} of 2 remaining this month
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" aria-label="Submit a wellness question">
        {/* Category */}
        <div>
          <label htmlFor="qa-category" className="text-xs font-medium text-text-secondary block mb-1">
            Category
          </label>
          <select
            id="qa-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as QACategory)}
            className="w-full rounded-btn border border-gray-200 bg-surface px-3 py-2 text-sm
                       text-text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
                       min-h-[44px]"
          >
            {QA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Question text */}
        <div>
          <label htmlFor="qa-question" className="text-xs font-medium text-text-secondary block mb-1">
            Your question
          </label>
          <textarea
            id="qa-question"
            rows={3}
            maxLength={300}
            minLength={10}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about TCM, your constitution, seasonal health, or general wellbeing…"
            aria-describedby="qa-char-count qa-hint"
            className="w-full rounded-btn border border-gray-200 px-3 py-2 text-sm text-text-primary
                       placeholder:text-text-secondary resize-none
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="flex items-center justify-between mt-1">
            <p id="qa-hint" className="text-xs text-text-secondary">
              Questions are answered by our TCM practitioner.
            </p>
            <p
              id="qa-char-count"
              className={cn(
                'text-xs tabular-nums',
                charsLeft < 20 ? 'text-error' : 'text-text-secondary'
              )}
              aria-live="polite"
            >
              {charsLeft} left
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-error bg-error/10 border border-error/20 rounded-btn px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          aria-label="Submit your wellness question"
        >
          Submit question
        </Button>
      </form>
    </Card>
  )
}
