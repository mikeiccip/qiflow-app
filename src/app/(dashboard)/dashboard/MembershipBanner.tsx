import Link from 'next/link'
import { BILLING_PROMISE } from '@/types'

export function MembershipBanner() {
  return (
    <div
      className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2"
      role="complementary"
      aria-label="Membership upgrade"
    >
      <p className="text-sm font-semibold text-primary">
        🌱 Unlock your full QiFlow experience
      </p>
      <p className="text-xs text-text-secondary leading-relaxed">
        Personalised seasonal plans, the full library, all workshop recordings, and practitioner Q&amp;A —
        for £28/month.
      </p>
      <p className="text-xs text-text-secondary">{BILLING_PROMISE}</p>
      <Link
        href="/membership"
        className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors duration-200"
      >
        Become a member →
      </Link>
    </div>
  )
}
