import { HEALTH_DISCLAIMER } from '@/types'
import { cn } from '@/lib/utils'

interface HealthDisclaimerProps {
  compact?: boolean
  className?: string
}

export default function HealthDisclaimer({ compact, className }: HealthDisclaimerProps) {
  return (
    <p
      className={cn(
        'text-text-secondary',
        compact ? 'text-xs' : 'text-xs leading-relaxed',
        className
      )}
    >
      {HEALTH_DISCLAIMER}
    </p>
  )
}
