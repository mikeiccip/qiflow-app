import { type MilestoneStatus } from '@/lib/loyalty/milestones'
import { formatDate } from '@/lib/utils'

interface MilestoneGridProps {
  milestones: MilestoneStatus[]
}

export function MilestoneGrid({ milestones }: MilestoneGridProps) {
  const earned = milestones.filter((m) => m.earned)
  const locked = milestones.filter((m) => !m.earned)

  return (
    <section aria-label="Your achievements">
      {earned.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Earned · {earned.length}/{milestones.length}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {earned.map((m) => (
              <MilestoneBadge key={m.key} milestone={m} />
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Still to earn
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {locked.map((m) => (
              <MilestoneBadge key={m.key} milestone={m} locked />
            ))}
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <p className="text-sm text-text-secondary py-4">No milestones available yet.</p>
      )}
    </section>
  )
}

function MilestoneBadge({ milestone, locked = false }: { milestone: MilestoneStatus; locked?: boolean }) {
  return (
    <div
      role="listitem"
      aria-label={`${milestone.label}${locked ? ' — not yet earned' : milestone.reached_at ? ` — earned ${formatDate(milestone.reached_at, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
      className={`rounded-sm border p-3 space-y-1 transition-opacity ${
        locked
          ? 'border-border bg-surface opacity-40'
          : 'border-primary/20 bg-primary/5'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-2xl ${locked ? 'grayscale' : ''}`} aria-hidden="true">
          {milestone.icon}
        </span>
        {!locked && (
          <span className="text-xs text-primary font-medium">✓</span>
        )}
      </div>

      <p className="text-xs font-semibold text-text-primary leading-tight">{milestone.label}</p>
      <p className="text-xs text-text-secondary leading-tight">{milestone.description}</p>

      {!locked && milestone.reached_at && (
        <p className="text-xs text-text-secondary">
          {formatDate(milestone.reached_at, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}
