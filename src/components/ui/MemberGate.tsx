import { ReactNode } from 'react'

interface MemberGateProps {
  isMember: boolean
  featureName: string
  children: ReactNode
}

export default function MemberGate({ isMember, featureName, children }: MemberGateProps) {
  if (isMember) return <>{children}</>
  return (
    <div className="relative rounded-card overflow-hidden">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-4 text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">{featureName}</p>
        <p className="text-xs text-text-secondary mb-3">This feature is available to QiFlow members.</p>
        <a
          href="/membership"
          className="inline-flex items-center justify-center rounded-btn bg-primary text-white text-xs font-medium px-4 py-2 min-h-[36px] hover:bg-primary/90 transition-colors"
        >
          Become a member
        </a>
      </div>
    </div>
  )
}
