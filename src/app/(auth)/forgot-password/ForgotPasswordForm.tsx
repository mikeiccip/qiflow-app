'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email) { setError('Please enter your email address'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-3xl" aria-hidden="true">📬</div>
        <h2 className="text-lg font-bold text-text-primary">Check your inbox</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
        </p>
        <Link href="/login" className="block text-sm text-primary underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Reset your password" className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="reset-email" className="block text-xs font-medium text-text-secondary mb-1">
          Email address
        </label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        <Link href="/login" className="text-primary underline">Back to sign in</Link>
      </p>
    </form>
  )
}
