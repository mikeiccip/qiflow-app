'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validation/auth'
import { Button, Input } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setLoading(false)

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email or password is incorrect'
        : authError.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Log in to QiFlow" className="space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-text-secondary mb-1">
            Email address
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-xs font-medium text-text-secondary">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-primary underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        No account?{' '}
        <Link href="/signup" className="text-primary underline">
          Join QiFlow
        </Link>
      </p>
    </form>
  )
}
