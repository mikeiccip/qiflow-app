import Link from 'next/link'
import { Card } from '@/components/ui'

interface Checkin {
  checkin_date: string
  pain: number
  energy: number
  sleep: number
}

interface StatsPanelProps {
  checkins30: Checkin[]
  lastQuizDate: string | null
}

function computeStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0

  const dates = new Set(checkins.map((c) => c.checkin_date))
  const today = new Date().toISOString().split('T')[0]

  let streak = 0
  let cursor = new Date()

  // Start from today or yesterday if today has no check-in
  if (!dates.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (true) {
    const dateStr = cursor.toISOString().split('T')[0]
    if (!dates.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function monthAverage(checkins: Checkin[], field: keyof Omit<Checkin, 'checkin_date'>): number | null {
  if (checkins.length === 0) return null
  return Math.round((checkins.reduce((s, c) => s + c[field], 0) / checkins.length) * 10) / 10
}

function computeInsight(checkins30: Checkin[]): string | null {
  if (checkins30.length < 4) return null

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  const thisMonth = checkins30.filter((c) => c.checkin_date >= thisMonthStart)
  const lastMonth = checkins30.filter(
    (c) => c.checkin_date >= lastMonthStart && c.checkin_date <= lastMonthEnd
  )

  if (thisMonth.length < 2 || lastMonth.length < 2) return null

  const thisEnergy = monthAverage(thisMonth, 'energy') ?? 0
  const lastEnergy = monthAverage(lastMonth, 'energy') ?? 0

  if (lastEnergy === 0) return null

  const delta = Math.round(((thisEnergy - lastEnergy) / lastEnergy) * 100)

  if (delta >= 5) {
    return `Your energy supports ${delta}% better this month — keep it up!`
  }
  if (delta <= -5) {
    const thisSleep = monthAverage(thisMonth, 'sleep') ?? 0
    const lastSleep = monthAverage(lastMonth, 'sleep') ?? 0
    if (thisSleep > lastSleep) {
      return 'Your sleep quality is improving this month — a great foundation for energy.'
    }
    return 'Your energy scores are being tracked — consistency matters most.'
  }

  return 'Your wellbeing scores are consistent this month — steady progress.'
}

export function StatsPanel({ checkins30, lastQuizDate }: StatsPanelProps) {
  const streak = computeStreak(checkins30)
  const insight = computeInsight(checkins30)

  const today = new Date().toISOString().split('T')[0]
  const thisMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString().split('T')[0]

  const thisMonthCheckins = checkins30.filter((c) => c.checkin_date >= thisMonthStart)
  const lastMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  ).toISOString().split('T')[0]
  const lastMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    0
  ).toISOString().split('T')[0]
  const lastMonthCheckins = checkins30.filter(
    (c) => c.checkin_date >= lastMonthStart && c.checkin_date <= lastMonthEnd
  )

  const thisEnergy = monthAverage(thisMonthCheckins, 'energy')
  const lastEnergy = monthAverage(lastMonthCheckins, 'energy')
  const thisSleep = monthAverage(thisMonthCheckins, 'sleep')
  const lastSleep = monthAverage(lastMonthCheckins, 'sleep')

  // Prompt re-quiz if >90 days since last quiz
  const daysSinceQuiz = lastQuizDate
    ? Math.floor((Date.now() - new Date(lastQuizDate).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const showReQuizPrompt = daysSinceQuiz !== null && daysSinceQuiz >= 90

  return (
    <div className="space-y-3">
      {/* Streak + insight */}
      <Card padding="md">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl" aria-hidden="true">🔥</div>
          <div>
            <p className="text-lg font-bold text-text-primary" aria-label={`${streak} day streak`}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs text-text-secondary">Current streak</p>
          </div>
        </div>

        {insight && (
          <p className="text-sm text-primary bg-primary-light rounded-btn px-3 py-2" role="status">
            {insight}
          </p>
        )}
      </Card>

      {/* Month comparison */}
      {(thisEnergy !== null || lastEnergy !== null) && (
        <Card padding="md">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Month comparison
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCell
              label="Energy avg"
              thisMonth={thisEnergy}
              lastMonth={lastEnergy}
              higherIsBetter
            />
            <StatCell
              label="Sleep avg"
              thisMonth={thisSleep}
              lastMonth={lastSleep}
              higherIsBetter
            />
          </div>
        </Card>
      )}

      {/* Constitution re-test prompt */}
      {showReQuizPrompt && (
        <div className="bg-primary-light border border-primary/20 rounded-card p-4 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Time for a constitution check-in?
          </p>
          <p className="text-xs text-text-secondary">
            Your TCM constitution can shift with seasons and lifestyle. It&rsquo;s been {daysSinceQuiz} days
            since your last quiz — a re-test may reveal new insights.
          </p>
          <Link
            href="/constitution"
            className="inline-block text-xs font-semibold text-primary underline
                       focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Retake the quiz →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCell({
  label,
  thisMonth,
  lastMonth,
  higherIsBetter,
}: {
  label: string
  thisMonth: number | null
  lastMonth: number | null
  higherIsBetter: boolean
}) {
  const delta = thisMonth !== null && lastMonth !== null ? thisMonth - lastMonth : null
  const improved = delta !== null && (higherIsBetter ? delta > 0 : delta < 0)
  const declined = delta !== null && (higherIsBetter ? delta < 0 : delta > 0)

  return (
    <div className="space-y-0.5">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-base font-bold text-text-primary">
        {thisMonth !== null ? thisMonth : '–'}
        <span className="text-xs text-text-secondary font-normal">/10</span>
      </p>
      {delta !== null && (
        <p
          className={cn(
            'text-xs font-medium',
            improved ? 'text-success' : declined ? 'text-error' : 'text-text-secondary'
          )}
        >
          {improved ? '↑' : declined ? '↓' : '→'}{' '}
          {Math.abs(delta).toFixed(1)} vs last month
        </p>
      )}
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
