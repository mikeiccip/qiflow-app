import type { Metadata } from 'next'
import Link from 'next/link'
import { BILLING_PROMISE } from '@/types'

export const metadata: Metadata = {
  title: 'Become a member — QiFlow',
}

const FEATURES = [
  ['🌱', 'Personalised TCM seasonal plan', 'Updated every ~15 days with each solar term'],
  ['📚', 'Full knowledge library', 'Articles, podcasts, and video content — unlimited access'],
  ['🎓', 'Workshop recordings', 'All practitioner-led workshops with PDF summaries'],
  ['💬', 'Practitioner Q&A', 'Submit 2 questions per month directly to our TCM practitioner'],
  ['🏆', 'Loyalty milestones', 'Earn rewards for consistency and referring friends'],
  ['📊', 'Wellbeing trends', 'Track your energy, sleep, and mood over time'],
]

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-sm mx-auto space-y-8">

        <div className="text-center space-y-2">
          <Link href="/dashboard" className="text-xs text-text-secondary hover:text-primary transition-colors">
            ← Dashboard
          </Link>
          <div className="text-3xl mt-4" aria-hidden="true">🌸</div>
          <h1 className="text-2xl font-bold text-text-primary">Unlock full QiFlow</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Everything you need to live in harmony with your TCM constitution and the seasons.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-sm p-5 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">£28</p>
            <p className="text-xs text-text-secondary">per month</p>
            <p className="text-xs text-text-secondary mt-1">{BILLING_PROMISE}</p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(([icon, title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="text-base mt-0.5" aria-hidden="true">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{title}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/subscribe"
            className="block w-full text-center bg-primary text-white text-sm font-medium py-3 rounded-btn hover:bg-primary/90 transition-colors"
          >
            Join now — £28/month
          </Link>

          <p className="text-xs text-text-secondary text-center">
            Secure payment via Stripe. Cancel anytime from your profile.
          </p>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-text-secondary underline">
            Continue with free access
          </Link>
        </div>

      </div>
    </div>
  )
}
