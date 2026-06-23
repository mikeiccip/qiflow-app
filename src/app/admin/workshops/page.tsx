'use client'

import { useEffect, useState } from 'react'
import { Badge, Card } from '@/components/ui'
import { UploadForm } from './UploadForm'

interface AdminWorkshop {
  id: string
  slug: string | null
  title: string
  category: string
  is_members_only: boolean
  is_hidden: boolean
  held_on: string | null
  created_at: string
}

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiding, setHiding] = useState<string | null>(null)

  function loadWorkshops() {
    setLoading(true)
    fetch('/api/workshops?include_hidden=true')
      .then((r) => {
        if (r.status === 403) throw new Error('Admin access required')
        return r.json()
      })
      .then((data) => setWorkshops(data.workshops ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadWorkshops() }, [])

  async function hideWorkshop(id: string) {
    setHiding(id)
    try {
      const res = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to hide')
      }
      setWorkshops((prev) =>
        prev.map((w) => (w.id === id ? { ...w, is_hidden: true } : w))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setHiding(null)
    }
  }

  async function unhideWorkshop(id: string) {
    setHiding(id)
    try {
      const res = await fetch(`/api/admin/workshops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: false }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to unhide')
      }
      setWorkshops((prev) =>
        prev.map((w) => (w.id === id ? { ...w, is_hidden: false } : w))
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setHiding(null)
    }
  }

  if (loading) {
    return <div className="p-6"><p className="text-sm text-text-secondary">Loading workshops…</p></div>
  }

  if (error) {
    return <div className="p-6"><p className="text-sm text-error">{error}</p></div>
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Workshops</h1>
        <p className="text-sm text-text-secondary mt-1">
          {workshops.filter((w) => !w.is_hidden).length} published · {workshops.filter((w) => w.is_hidden).length} hidden
        </p>
      </div>

      {/* Upload form */}
      <section aria-label="Add workshop">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Add workshop</h2>
        <Card padding="md">
          <UploadForm
            onCreated={(id, slug) => {
              loadWorkshops()
            }}
          />
        </Card>
      </section>

      {/* Workshop list */}
      <section aria-label="All workshops">
        <h2 className="text-sm font-semibold text-text-primary mb-3">All workshops</h2>

        {workshops.length === 0 ? (
          <p className="text-sm text-text-secondary">No workshops yet.</p>
        ) : (
          <div className="space-y-2">
            {workshops.map((ws) => (
              <Card key={ws.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${ws.is_hidden ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                      {ws.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="muted">{ws.category}</Badge>
                      {ws.is_members_only && <Badge variant="primary">Members</Badge>}
                      {ws.is_hidden && <Badge variant="warning">Hidden</Badge>}
                      {ws.held_on && (
                        <span className="text-xs text-text-secondary">
                          {new Date(ws.held_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {ws.slug && (
                      <p className="text-xs text-text-secondary font-mono">/workshops/{ws.slug}</p>
                    )}
                  </div>

                  <button
                    onClick={() => ws.is_hidden ? unhideWorkshop(ws.id) : hideWorkshop(ws.id)}
                    disabled={hiding === ws.id}
                    className="shrink-0 text-xs px-2 py-1 rounded-sm border border-border text-text-secondary hover:text-error hover:border-error transition-colors duration-200 disabled:opacity-50"
                    aria-label={ws.is_hidden ? `Show workshop: ${ws.title}` : `Hide workshop: ${ws.title}`}
                  >
                    {hiding === ws.id ? '…' : ws.is_hidden ? 'Show' : 'Hide'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
