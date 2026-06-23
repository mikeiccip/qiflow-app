import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  showSeal?: boolean
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #EFE7D6)' }}>
      {children}
    </div>
  )
}
