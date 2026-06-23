import Link from 'next/link'

const FEATURES = [
  {
    href: '/library',
    icon: '📚',
    label: 'Library',
    blurb: 'Articles, recipes & podcasts',
  },
  {
    href: '/workshops',
    icon: '🎓',
    label: 'Workshops',
    blurb: 'Practitioner recordings',
  },
  {
    href: '/community',
    icon: '💬',
    label: 'Community Q&A',
    blurb: 'Ask your practitioner',
  },
  {
    href: '/food-check',
    icon: '🥢',
    label: 'Food Check',
    blurb: 'TCM food properties',
  },
  {
    href: '/progress',
    icon: '📈',
    label: 'Progress',
    blurb: 'Your wellbeing trends',
  },
  {
    href: '/loyalty',
    icon: '🏆',
    label: 'Milestones',
    blurb: 'Achievements & referrals',
  },
] as const

export function FeatureGrid() {
  return (
    <section aria-label="Features">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
        Explore
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {FEATURES.map(({ href, icon, label, blurb }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-lg bg-surface border border-border p-3 text-center hover:border-primary/40 hover:bg-surface-alt transition-colors duration-200"
          >
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <span className="text-xs font-medium text-text-primary leading-tight">{label}</span>
            <span className="text-[10px] text-text-secondary leading-tight hidden sm:block">{blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
