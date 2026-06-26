'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { CONSTITUTION_LABELS, type ConstitutionType, type ConstitutionAnalysis } from '@/types'

const QUESTIONS = [
  { id: 'energy_fatigue', text: 'I feel tired or low in energy, even after a full night\'s sleep.' },
  { id: 'shortness_breath', text: 'I get short of breath easily with mild activity or walking.' },
  { id: 'cold_hands_feet', text: 'My hands and feet feel cold, even in warm weather.' },
  { id: 'cold_intolerance', text: 'I prefer warmth and dislike cold weather or cold environments.' },
  { id: 'thirst_dryness', text: 'I feel thirsty and prefer cool or cold drinks.' },
  { id: 'night_sweats', text: 'I experience hot flushes, night sweats, or feel warm in the evenings.' },
  { id: 'weight_heaviness', text: 'I feel heavy-bodied, sluggish, or carry extra weight around my middle.' },
  { id: 'oily_skin', text: 'My skin is oily, or I get spots and skin breakouts easily.' },
  { id: 'digestive_sluggish', text: 'My digestion is slow — I feel bloated or heavy after meals.' },
  { id: 'phlegm_mucus', text: 'I produce a lot of phlegm or mucus, or feel congested in my chest or throat.' },
  { id: 'bruising_veins', text: 'I bruise easily or notice dark circles under my eyes.' },
  { id: 'pain_fixed', text: 'I experience pain that feels fixed, stabbing, or gets worse with pressure.' },
  { id: 'stress_mood', text: 'I feel stressed, irritable, or emotionally tense, especially under pressure.' },
  { id: 'sigh_chest', text: 'I often sigh deeply or feel a tightness or pressure in my chest.' },
  { id: 'allergy_sensitive', text: 'I have allergies, hay fever, or am sensitive to certain foods or substances.' },
  { id: 'skin_reactions', text: 'My skin reacts easily — I get rashes, hives, or itching without obvious cause.' },
  { id: 'sweat_easily', text: 'I sweat easily, even with minimal exertion or in cool temperatures.' },
  { id: 'digestion_loose', text: 'I experience loose stools or digestive upsets relatively often.' },
  { id: 'concentration', text: 'I find it hard to concentrate or my thinking feels foggy.' },
  { id: 'sleep_quality', text: 'I have trouble falling asleep, staying asleep, or wake feeling unrefreshed.' },
] as const

const SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Always' },
]

type QuestionId = typeof QUESTIONS[number]['id']
type Answers = Partial<Record<QuestionId, number>>

interface ResultViewProps {
  result: ConstitutionAnalysis
  onContinue: () => void
}

function ResultView({ result, onContinue }: ResultViewProps) {
  const label = CONSTITUTION_LABELS[result.primary as ConstitutionType]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl" aria-hidden="true">🧬</div>
        <h2 className="text-xl font-bold text-text-primary">Your TCM constitution</h2>
        <p
          className="text-2xl font-bold"
          style={{ color: label.color }}
        >
          {label.en}
        </p>
        <p className="text-sm text-text-secondary">{label.zh} · {result.percentage_match}% match</p>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{result.description}</p>

      {result.secondary && (
        <p className="text-xs text-text-secondary text-center">
          Secondary tendency: {CONSTITUTION_LABELS[result.secondary as ConstitutionType].en}
        </p>
      )}

      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-sm p-4 space-y-2">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Common characteristics</p>
          <ul className="space-y-1">
            {result.key_symptoms.map((s) => (
              <li key={s} className="text-xs text-text-primary flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>{s}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-sm p-3 space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Foods to embrace</p>
            <ul className="space-y-1">
              {result.foods_to_eat.map((f) => (
                <li key={f} className="text-xs text-text-primary flex items-start gap-1.5">
                  <span className="text-green-600 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-sm p-3 space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Foods to reduce</p>
            <ul className="space-y-1">
              {result.foods_to_avoid.map((f) => (
                <li key={f} className="text-xs text-text-primary flex items-start gap-1.5">
                  <span className="text-error mt-0.5">–</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-sm p-4 space-y-2">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Lifestyle tips</p>
          <ul className="space-y-1">
            {result.lifestyle_tips.map((t) => (
              <li key={t} className="text-xs text-text-primary flex items-start gap-2">
                <span className="text-primary mt-0.5">·</span>{t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center leading-relaxed">
        QiFlow supports general wellbeing and is not a substitute for medical diagnosis or treatment.
        Always consult your GP for health concerns.
      </p>

      <Button onClick={onContinue} className="w-full">
        Continue →
      </Button>
    </div>
  )
}

interface ConstitutionQuizProps {
  returnToOnboarding: boolean
}

export function ConstitutionQuiz({ returnToOnboarding }: ConstitutionQuizProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Answers>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConstitutionAnalysis | null>(null)

  const PAGE_SIZE = 5
  const totalPages = Math.ceil(QUESTIONS.length / PAGE_SIZE)
  const pageQuestions = QUESTIONS.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const answeredOnPage = pageQuestions.every((q) => answers[q.id] !== undefined)
  const totalAnswered = Object.keys(answers).length
  const progress = Math.round((totalAnswered / QUESTIONS.length) * 100)

  function setAnswer(id: QuestionId, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/constitution/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleContinue() {
    if (returnToOnboarding) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  if (result) {
    return <ResultView result={result} onContinue={handleContinue} />
  }

  const isLastPage = currentPage === totalPages - 1

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Page {currentPage + 1} of {totalPages}</span>
          <span>{totalAnswered}/{QUESTIONS.length} answered</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <p className="text-xs text-text-secondary">
        Rate how often each statement applies to you over the past month.
      </p>

      <div className="space-y-6">
        {pageQuestions.map((q, i) => (
          <div key={q.id} className="space-y-3">
            <p className="text-sm text-text-primary leading-relaxed">
              <span className="text-text-secondary mr-1">{currentPage * PAGE_SIZE + i + 1}.</span>
              {q.text}
            </p>
            <div className="flex gap-2 flex-wrap">
              {SCALE.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setAnswer(q.id, value)}
                  className={`flex-1 min-w-[52px] py-2 text-xs rounded-sm border transition-colors ${
                    answers[q.id] === value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border text-text-secondary hover:border-primary'
                  }`}
                  aria-pressed={answers[q.id] === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <div className="flex gap-3">
        {currentPage > 0 && (
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="flex-1" />
        {isLastPage ? (
          <Button
            onClick={handleSubmit}
            disabled={!answeredOnPage || submitting}
            loading={submitting}
          >
            {submitting ? 'Analysing…' : 'See my constitution →'}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!answeredOnPage}
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  )
}
