import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ToastContainer } from '@/components/ui'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'QiFlow', template: '%s | QiFlow' },
  description: 'Your TCM wellness companion — personalised to your constitution.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'QiFlow' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0D6B6E',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg text-text-primary antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-full focus:ring-2 focus:ring-primary/50 focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <ToastContainer />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
