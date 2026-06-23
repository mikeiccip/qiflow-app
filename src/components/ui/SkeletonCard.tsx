import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-card bg-gray-100 animate-pulse h-24', className)} aria-hidden="true" />
  )
}
