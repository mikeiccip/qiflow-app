'use client'

import { useState, useRef } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { WORKSHOP_CATEGORIES } from '@/types'

interface UploadFormProps {
  onCreated: (id: string, slug: string) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export function UploadForm({ onCreated }: UploadFormProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [heldOn, setHeldOn] = useState('')
  const [isMembersOnly, setIsMembersOnly] = useState(true)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUploading(true)

    try {
      // 1. Upload PDF if provided
      let pdfPath: string | null = null
      if (pdfFile) {
        const fd = new FormData()
        fd.append('pdf', pdfFile)
        const res = await fetch('/api/admin/workshops/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error ?? 'PDF upload failed')
        }
        const d = await res.json()
        pdfPath = d.path
      }

      // 2. Create workshop record
      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          description: description || null,
          video_url: videoUrl || null,
          pdf_url: pdfPath,
          thumbnail_url: thumbnailUrl || null,
          duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
          category,
          is_members_only: isMembersOnly,
          held_on: heldOn || null,
          constitution_tags: [],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create workshop')

      setSuccess(true)
      onCreated(data.workshop.id, data.workshop.slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-sm border border-success/30 bg-success/10 p-4 text-sm text-text-primary">
        ✓ Workshop created successfully.
        <button
          className="ml-3 text-primary underline"
          onClick={() => {
            setSuccess(false)
            setTitle('')
            setSlug('')
            setDescription('')
            setVideoUrl('')
            setThumbnailUrl('')
            setDurationMinutes('')
            setHeldOn('')
            setPdfFile(null)
            if (fileRef.current) fileRef.current.value = ''
          }}
        >
          Add another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Upload workshop" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ws-title" className="block text-xs font-medium text-text-secondary mb-1">
            Title *
          </label>
          <Input
            id="ws-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Spring Liver Qi Workshop"
            required
          />
        </div>

        <div>
          <label htmlFor="ws-slug" className="block text-xs font-medium text-text-secondary mb-1">
            Slug *
          </label>
          <Input
            id="ws-slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="spring-liver-qi-workshop"
            required
          />
        </div>

        <div>
          <label htmlFor="ws-category" className="block text-xs font-medium text-text-secondary mb-1">
            Category *
          </label>
          <select
            id="ws-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {WORKSHOP_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="ws-description" className="block text-xs font-medium text-text-secondary mb-1">
            Description
          </label>
          <Textarea
            id="ws-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What members will learn in this session…"
            maxLength={2000}
          />
        </div>

        <div>
          <label htmlFor="ws-video" className="block text-xs font-medium text-text-secondary mb-1">
            Video URL (YouTube, Vimeo, or direct)
          </label>
          <Input
            id="ws-video"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>

        <div>
          <label htmlFor="ws-thumbnail" className="block text-xs font-medium text-text-secondary mb-1">
            Thumbnail URL
          </label>
          <Input
            id="ws-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <label htmlFor="ws-held-on" className="block text-xs font-medium text-text-secondary mb-1">
            Date held
          </label>
          <Input
            id="ws-held-on"
            type="date"
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="ws-duration" className="block text-xs font-medium text-text-secondary mb-1">
            Duration (minutes)
          </label>
          <Input
            id="ws-duration"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            min={1}
            max={600}
            placeholder="60"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="ws-pdf" className="block text-xs font-medium text-text-secondary mb-1">
            PDF summary (max 20 MB)
          </label>
          <input
            id="ws-pdf"
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            aria-label="Upload PDF summary"
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="ws-members-only"
            type="checkbox"
            checked={isMembersOnly}
            onChange={(e) => setIsMembersOnly(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <label htmlFor="ws-members-only" className="text-sm text-text-primary">
            Members only
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={uploading || !title || !slug}>
        {uploading ? 'Uploading…' : 'Create workshop'}
      </Button>
    </form>
  )
}
