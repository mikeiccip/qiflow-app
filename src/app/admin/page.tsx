import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — QiFlow' }

const SECTIONS = [
  { href: '/admin/analytics', label: 'Analytics', description: 'Member metrics, event counts, active users' },
  { href: '/admin/qa', label: 'Community Q&A', description: 'Review questions and draft practitioner answers' },
  { href: '/admin/workshops', label: 'Workshops', description: 'Upload recordings and PDF summaries' },
]

export default function AdminPage() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        <p className="text-sm text-text-secondary mt-1">QiFlow practitioner dashboard</p>
      </div>

      <nav aria-label="Admin sections">
        <ul className="space-y-3">
          {SECTIONS.map(({ href, label, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-primary/40 hover:bg-surface-alt transition-colors duration-200"
              >
                <div>
                  <p className="font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
                <span className="text-text-secondary" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
