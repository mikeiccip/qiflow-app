import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — QiFlow',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <Link href="/signup" className="text-xs text-text-secondary hover:text-primary transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Terms of Service</h1>
          <p className="text-sm text-text-secondary mt-1">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">1. About QiFlow</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            QiFlow is a Traditional Chinese Medicine (TCM) wellness platform operated by Cheuk&apos;s TCM.
            It provides general wellbeing guidance, educational content, and personalised wellness plans
            based on TCM principles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">2. Not medical advice</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            QiFlow is a general wellbeing and educational service. Nothing on QiFlow constitutes
            medical advice, diagnosis, or treatment. All content is for informational purposes only.
            Always consult a qualified GP or medical professional for health concerns.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">3. Eligibility</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            You must be 18 years of age or older to create an account and use QiFlow.
            By signing up you confirm you meet this requirement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">4. Membership and billing</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Paid membership is billed monthly at £28/month. No minimum contract. You may cancel at
            any time and retain access until the end of your billing period. Refunds are not provided
            for partial months.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">5. Your account</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            You are responsible for keeping your login credentials secure. You may not share your
            account with others. We reserve the right to suspend accounts that violate these terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">6. Intellectual property</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            All content on QiFlow — including articles, plans, and workshop recordings — is owned
            by Cheuk&apos;s TCM. You may not reproduce, distribute, or resell it without permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">7. Limitation of liability</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            QiFlow is provided &quot;as is&quot;. To the fullest extent permitted by law, Cheuk&apos;s TCM
            excludes all warranties and shall not be liable for any indirect or consequential losses
            arising from your use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">8. Governing law</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            These terms are governed by the laws of England and Wales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">9. Contact</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Questions about these terms? Email us at{' '}
            <a href="mailto:hello@cheukstcm.co.uk" className="text-primary underline">
              hello@cheukstcm.co.uk
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
