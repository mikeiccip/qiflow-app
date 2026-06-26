import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — QiFlow',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <Link href="/signup" className="text-xs text-text-secondary hover:text-primary transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Privacy Policy</h1>
          <p className="text-sm text-text-secondary mt-1">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">1. Who we are</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            QiFlow is operated by Cheuk&apos;s TCM. This policy explains what data we collect,
            how we use it, and your rights under UK GDPR.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">2. What data we collect</h2>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1.5 list-disc list-inside">
            <li>Account information: name, email address, date of birth</li>
            <li>Wellbeing data: daily check-ins, constitution quiz results, food logs</li>
            <li>Usage data: pages visited, features used</li>
            <li>Payment data: managed by Stripe — we do not store card details</li>
            <li>Consent records: timestamps of when you accepted each consent</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">3. How we use your data</h2>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1.5 list-disc list-inside">
            <li>To provide and personalise your QiFlow experience</li>
            <li>To generate your TCM constitution analysis and seasonal plans</li>
            <li>To send service communications (account, billing)</li>
            <li>To send wellness tips, if you opted in</li>
            <li>To improve the platform based on aggregate usage patterns</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">4. Legal basis</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We process your data under contract (to deliver the service you signed up for),
            legitimate interests (platform improvement), and consent (health data and marketing).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">5. Health data</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We collect wellbeing data that may be considered special category health data under UK GDPR.
            We process this only with your explicit consent, which you provided on sign-up.
            This data is stored securely and never sold or shared with third parties for marketing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">6. Third parties</h2>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-1.5 list-disc list-inside">
            <li><strong>Supabase</strong> — secure database hosting (EU region)</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Vercel</strong> — application hosting</li>
            <li><strong>Anthropic (Claude)</strong> — AI personalisation features</li>
          </ul>
          <p className="text-sm text-text-secondary leading-relaxed">
            All processors are contractually bound to handle your data securely.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">7. Data retention</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We retain your data for as long as your account is active. If you delete your account,
            we delete your personal data within 30 days, except where we are legally required to
            retain it (e.g. billing records for 7 years).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">8. Your rights</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Under UK GDPR you have the right to access, correct, delete, or export your data,
            and to withdraw consent at any time. Contact us at{' '}
            <a href="mailto:hello@cheukstcm.co.uk" className="text-primary underline">
              hello@cheukstcm.co.uk
            </a>{' '}
            to exercise these rights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">9. Cookies</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We use a session cookie to keep you logged in. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-text-primary">10. Contact</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Data controller: Cheuk&apos;s TCM. Email:{' '}
            <a href="mailto:hello@cheukstcm.co.uk" className="text-primary underline">
              hello@cheukstcm.co.uk
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
