import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary tracking-tight">QiFlow</h1>
          <p className="text-xs text-text-secondary mt-1">TCM Wellness · By Cheuk&apos;s TCM</p>
        </div>
        {children}
      </div>
    </div>
  )
}
