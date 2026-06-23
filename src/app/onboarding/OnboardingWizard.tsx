'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { CONSTITUTION_LABELS, HEALTH_DISCLAIMER, BILLING_PROMISE, type ConstitutionType } from '@/types'

interface OnboardingWizardProps {
  fullName: string
  constitutionPrimary: ConstitutionType | null
}

type Step = 'welcome' | 'constitution' | 'membership' | 'complete'
const STEPS: Step[] = ['welcome', 'constitution', 'membership', 'complete']

export function OnboardingWizard({ fullName, constitutionPrimary }: OnboardingWizardProps) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = STEPS[stepIndex]
  const firstName = fullName.split(' ')[0]

  function next() {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
  }

  function prev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  async function complete() {
    setCompleting(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', { method: 'POST' })
      if (!res.ok) throw new Error('Could not complete setup')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1} aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${i <= stepIndex ? 'bg-primary w-6' : 'bg-border w-3'}`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="space-y-5 text-center">
            <div className="text-4xl" aria-hidden="true">🌿</div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-text-primary">
                Welcome, {firstName}!
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                QiFlow brings Traditional Chinese Medicine to your everyday life — personalised
                to your unique constitution, the seasons, and how you feel day to day.
              </p>
            </div>

            <ul className="text-left space-y-2 text-sm text-text-primary">
              {[
                ['📋', 'Track your daily wellbeing'],
                ['🌱', 'Get seasonal food & lifestyle guidance'],
                ['📚', 'Access the TCM knowledge library'],
                ['🎓', 'Watch practitioner workshops'],
                ['💬', 'Ask our TCM practitioner directly'],
              ].map(([icon, text]) => (
                <li key={text as string} className="flex items-start gap-2">
                  <span aria-hidden="true">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Button onClick={next} className="w-full">Get started →</Button>
          </div>
        )}

        {/* Step: Constitution */}
        {step === 'constitution' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="text-4xl" aria-hidden="true">🧬</div>
              <h2 className="text-xl font-bold text-text-primary">Know your constitution</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your TCM constitution shapes what foods, seasons, and activities best support your
                wellbeing. A 5-minute quiz reveals yours.
              </p>
            </div>

            {constitutionPrimary ? (
              <Card padding="md" className="text-center space-y-2">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Your constitution</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: CONSTITUTION_LABELS[constitutionPrimary].color }}
                >
                  {CONSTITUTION_LABELS[constitutionPrimary].en}
                </p>
                <p className="text-sm text-text-secondary">{CONSTITUTION_LABELS[constitutionPrimary].zh}</p>
                <p className="text-xs text-primary">Quiz complete ✓</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <Link href="/constitution?onboarding=1" className="block">
                  <Button className="w-full">Take the quiz (5 min)</Button>
                </Link>
                <button
                  onClick={next}
                  className="w-full text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}

            {constitutionPrimary && (
              <Button onClick={next} className="w-full">Continue →</Button>
            )}

            <button onClick={prev} className="w-full text-xs text-text-secondary hover:text-primary transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* Step: Membership */}
        {step === 'membership' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="text-4xl" aria-hidden="true">🌸</div>
              <h2 className="text-xl font-bold text-text-primary">Unlock full access</h2>
              <p className="text-sm text-text-secondary">
                Members get personalised seasonal plans, the full knowledge library, workshop
                recordings, and direct practitioner Q&amp;A.
              </p>
            </div>

            <Card padding="md" className="space-y-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">£28</p>
                <p className="text-xs text-text-secondary">per month</p>
              </div>
              <p className="text-xs text-text-secondary text-center">{BILLING_PROMISE}</p>
              <ul className="text-xs text-text-primary space-y-1.5">
                {[
                  'Personalised TCM seasonal plan',
                  'Full knowledge library (articles, podcasts)',
                  'All workshop recordings + PDF summaries',
                  'Practitioner Q&A — 2 questions/month',
                  'Loyalty milestones and referral rewards',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-2">
              <Link href="/subscribe" className="block">
                <Button className="w-full">Join now — £28/month</Button>
              </Link>
              <Button variant="secondary" onClick={next} className="w-full">
                Explore free features first
              </Button>
            </div>

            <button onClick={prev} className="w-full text-xs text-text-secondary hover:text-primary transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-5 text-center">
            <div className="text-4xl" aria-hidden="true">✨</div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text-primary">You&apos;re all set!</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your QiFlow dashboard is ready. We&apos;ll remind you to check in daily and
                guide you through each season.
              </p>
            </div>

            <p className="text-xs text-text-secondary px-2">{HEALTH_DISCLAIMER}</p>

            {error && (
              <p role="alert" className="text-sm text-error">{error}</p>
            )}

            <Button onClick={complete} disabled={completing} className="w-full">
              {completing ? 'Setting up…' : 'Enter QiFlow →'}
            </Button>

            <button onClick={prev} className="w-full text-xs text-text-secondary hover:text-primary transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
