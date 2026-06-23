import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  showSeal?: boolean
  headerRight?: ReactNode
}

export function DashboardLayout({ children, title, headerRight }: DashboardLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #EFE7D6)' }}>
      {(title || headerRight) && (
        <header className="sticky top-0 z-10 bg-paper/80 backdrop-blur-sm border-b border-black/5 px-4 py-3 flex items-center justify-between">
          {title && <h1 className="text-base font-semibold text-text-primary">{title}</h1>}
          {headerRight && <div>{headerRight}</div>}
        </header>
      )}
      <main id="main-content">{children}</main>
    </div>
  )
}

export default DashboardLayout
