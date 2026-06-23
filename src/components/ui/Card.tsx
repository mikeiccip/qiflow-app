import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md'
  children?: ReactNode
}

export default function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-surface shadow-card',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4',
        padding === 'none' && '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
