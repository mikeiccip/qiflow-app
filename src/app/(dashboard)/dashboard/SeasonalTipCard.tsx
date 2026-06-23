import Link from 'next/link'
import { Card } from '@/components/ui'

interface SeasonalTipCardProps {
  solarTerm: string | null
  solarTermZh: string | null
  theme: string | null
  tipOfDay: string | null
}

export function SeasonalTipCard({ solarTerm, solarTermZh, theme, tipOfDay }: SeasonalTipCardProps) {
  return (
    <Card
      padding="md"
      className="space-y-3 border-l-2 border-l-secondary"
      role="region"
      aria-label="Seasonal tip"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Seasonal guidance
          </h2>
          {solarTerm && (
            <p className="text-sm font-medium text-text-primary">
              {solarTerm}
              {solarTermZh && (
                <span className="ml-1.5 text-xs text-text-secondary">（{solarTermZh}）</span>
              )}
            </p>
          )}
        </div>
        <Link
          href="/seasonal-plan"
          className="text-xs text-primary hover:underline whitespace-nowrap"
        >
          View plan →
        </Link>
      </div>

      {theme && (
        <p className="text-sm text-text-secondary leading-relaxed">{theme}</p>
      )}

      {tipOfDay && (
        <div className="rounded bg-surface-alt px-3 py-2">
          <p className="text-xs font-medium text-primary mb-0.5">Today's focus</p>
          <p className="text-xs text-text-secondary leading-relaxed">{tipOfDay}</p>
        </div>
      )}

      {!theme && !tipOfDay && (
        <p className="text-sm text-text-secondary">
          Your seasonal plan is ready.{' '}
          <Link href="/seasonal-plan" className="text-primary underline">
            View guidance
          </Link>{' '}
          for this solar term.
        </p>
      )}
    </Card>
  )
}
