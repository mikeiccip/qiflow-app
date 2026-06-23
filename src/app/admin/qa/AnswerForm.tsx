'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AnswerFormProps {
  questionId: string
  aiDraft: string | null
  onAnswered: (id: string) => void
}

export function AnswerForm({ questionId, aiDraft, onAnswered }: AnswerFormProps) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftUsed, setDraftUsed] = useState(false)

  function useDraft() {
    if (aiDraft) {
      // Strip practitioner notes from the draft before populating the answer field
      const cleanDraft = aiDraft.replace(/\n\n\[Practitioner note:.*?\]$/s, '').trim()
      setAnswer(cleanDraft)
      setDraftUsed(true)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/qa/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer.trim() }),
      })

      if (res.ok) {
        onAnswered(questionId)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to publish answer')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function hide() {
    setSubmitting(true)
    try {
      await fetch(`/api/admin/qa/${questionId}/hide`, { method: 'POST' })
      onAnswered(questionId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 pt-3 border-t border-gray-100">
      {/* AI draft — admin only, never shown to members */}
      {aiDraft && (
        <div className="bg-amber-50 border border-amber-200 rounded-btn p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800">
              🤖 AI draft suggestion (practitioner eyes only — never auto-published)
            </p>
            <button
              type="button"
              onClick={useDraft}
              disabled={draftUsed}
              className="text-xs text-amber-700 underline focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              {draftUsed ? 'Used' : 'Use as starting point'}
            </button>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{aiDraft}</p>
        </div>
      )}

      <div>
        <label htmlFor={`answer-${questionId}`} className="text-xs font-medium text-text-secondary block mb-1">
          Your answer
        </label>
        <textarea
          id={`answer-${questionId}`}
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your answer here. Remember: frame as TCM wellness support, not medical advice."
          className="w-full rounded-btn border border-gray-200 px-3 py-2 text-sm resize-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="text-xs text-text-secondary mt-1">{answer.length} characters</p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-error">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!answer.trim()}
        >
          Publish answer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={hide}
          disabled={submitting}
          className="text-error hover:text-error"
        >
          Hide question
        </Button>
      </div>
    </form>
  )
}
