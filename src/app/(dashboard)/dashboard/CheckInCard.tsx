import Link from 'next/link'
import { Card } from '@/components/ui'

interface TodayCheckin {
  mood: string
  energy: number
  sleep: number
  pain: number
}

interface CheckInCardProps {
  checkin: TodayCheckin | null
}

const ENERGY_LABELS = ['Very low', 'Low', 'Moderate', 'Good', 'Excellent']

function energyLabel(v: number) {
  return ENERGY_LABELS[Math.round((v / 10) * 4)] ?? ''
}

export function CheckInCard({ checkin }: CheckInCardProps) {
  if (checkin) {
    return (
      <Card padding="md" className="space-y-3" role="region" aria-label="Today's check-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Today&apos;s check-in ✓
          </h2>
          <Link href="/progress/log" className="text-xs text-primary hover:underline">
            Edit
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl" aria-label={`Mood: ${checkin.mood}`}>
            {checkin.mood}
          </span>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <ScoreTile label="Energy" value={checkin.energy} />
            <ScoreTile label="Sleep" value={checkin.sleep} />
            <ScoreTile label="Pain" value={checkin.pain} invert />
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Energy feels {energyLabel(checkin.energy).toLowerCase()} today.
        </p>
      </Card>
    )
  }

  return (
    <Card padding="md" className="space-y-3 border-l-2 border-l-primary" role="region" aria-label="Daily check-in prompt">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Daily check-in
      </h2>
      <p className="text-sm text-text-primary">How are you feeling today?</p>
      <p className="text-xs text-text-secondary">
        Track your energy, sleep, and mood to build a picture of your wellbeing over time.
      </p>
      <Link
        href="/progress/log"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors duration-200"
      >
        Log today →
      </Link>
    </Card>
  )
}

function ScoreTile({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const displayValue = invert ? 10 - value : value
  const colour = displayValue >= 7 ? 'text-success' : displayValue >= 4 ? 'text-primary' : 'text-error'
  return (
    <div>
      <p className={`text-lg font-bold ${colour}`} aria-label={`${label}: ${displayValue} out of 10`}>
        {displayValue}
      </p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  )
}
