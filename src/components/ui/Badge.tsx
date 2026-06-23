import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CONSTITUTION_LABELS, type ConstitutionType } from '@/types'

type BadgeVariant = 'default' | 'constitution' | 'muted' | 'primary' | 'success' | 'warning' | 'error'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  constitution?: ConstitutionType
  children?: ReactNode
}

const variantStyles: Record<Exclude<BadgeVariant, 'constitution'>, string> = {
  default: 'bg-gray-100 text-gray-700 border border-gray-200',
  muted: 'bg-gray-50 text-gray-500 border border-gray-100',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
}

export default function Badge({ variant = 'default', constitution, children, className, style, ...props }: BadgeProps) {
  if (variant === 'constitution' && constitution) {
    const label = CONSTITUTION_LABELS[constitution]
    return (
      <span
        className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', className)}
        style={{ backgroundColor: `${label.color}20`, color: label.color, border: `1px solid ${label.color}40`, ...style }}
        {...props}
      >
        {children ?? label.en}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        variantStyles[variant as Exclude<BadgeVariant, 'constitution'>] ?? variantStyles.default,
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  )
}
