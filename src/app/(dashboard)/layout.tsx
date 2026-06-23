import { PersistentAudioPlayer } from '@/components/audio/PersistentAudioPlayer'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <main id="main-content">
        {children}
      </main>
      <PersistentAudioPlayer />
    </ErrorBoundary>
  )
}
