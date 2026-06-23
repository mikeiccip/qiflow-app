import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center space-y-2', className)}>
      {icon && <span className="text-3xl" aria-hidden="true">{icon}</span>}
      {title && <p className="text-sm font-semibold text-text-primary">{title}</p>}
      {description && <p className="text-xs text-text-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
