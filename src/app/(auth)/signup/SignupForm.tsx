'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signupSchema } from '@/lib/validation/auth'
import { HEALTH_DISCLAIMER, BILLING_PROMISE } from '@/types'
import { Button, Input } from '@/components/ui'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    date_of_birth: '',
    marketing_consent: false,
    referred_by: refCode,
  })
  const [consents, setConsents] = useState({
    age_confirmed: false,
    terms_accepted: false,
    health_data_consent: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function field(key: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function consent(key: keyof typeof consents, value: boolean) {
    setConsents((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const payload = { ...formData, ...consents }
    const parsed = signupSchema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.errors) {
        const path = issue.path[0]?.toString() ?? ''
        errs[path] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Signup failed. Please try again.')
      return
    }

    router.push('/onboarding')
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Create a QiFlow account" className="space-y-5">

      <div className="space-y-3">
        <div>
          <label htmlFor="signup-name" className="block text-xs font-medium text-text-secondary mb-1">
            Full name *
          </label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={formData.full_name}
            onChange={(e) => field('full_name', e.target.value)}
            placeholder="Your name"
            required
            aria-invalid={!!fieldErrors.full_name}
            aria-describedby={fieldErrors.full_name ? 'err-name' : undefined}
          />
          {fieldErrors.full_name && (
            <p id="err-name" role="alert" className="mt-1 text-xs text-error">{fieldErrors.full_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-text-secondary mb-1">
            Email address *
          </label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => field('email', e.target.value)}
            placeholder="you@example.com"
            required
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'err-email' : undefined}
          />
          {fieldErrors.email && (
            <p id="err-email" role="alert" className="mt-1 text-xs text-error">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-xs font-medium text-text-secondary mb-1">
            Password *
          </label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => field('password', e.target.value)}
            required
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'err-pw' : undefined}
          />
          {fieldErrors.password && (
            <p id="err-pw" role="alert" className="mt-1 text-xs text-error">{fieldErrors.password}</p>
          )}
          <p className="mt-1 text-xs text-text-secondary">
            8+ characters, at least one uppercase letter and one number
          </p>
        </div>

        <div>
          <label htmlFor="signup-dob" className="block text-xs font-medium text-text-secondary mb-1">
            Date of birth * <span className="text-text-secondary font-normal">(must be 18+)</span>
          </label>
          <Input
            id="signup-dob"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => field('date_of_birth', e.target.value)}
            required
            aria-invalid={!!fieldErrors.date_of_birth}
            aria-describedby={fieldErrors.date_of_birth ? 'err-dob' : undefined}
          />
          {fieldErrors.date_of_birth && (
            <p id="err-dob" role="alert" className="mt-1 text-xs text-error">{fieldErrors.date_of_birth}</p>
          )}
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Consents &amp; agreements
        </legend>

        <ConsentCheckbox
          id="age_confirmed"
          checked={consents.age_confirmed}
          onChange={(v) => consent('age_confirmed', v)}
          error={fieldErrors.age_confirmed}
          required
        >
          I confirm I am 18 years of age or older
        </ConsentCheckbox>

        <ConsentCheckbox
          id="terms_accepted"
          checked={consents.terms_accepted}
          onChange={(v) => consent('terms_accepted', v)}
          error={fieldErrors.terms_accepted}
          required
        >
          I accept the{' '}
          <Link href="/terms" className="underline text-primary" target="_blank">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline text-primary" target="_blank">Privacy Policy</Link>
        </ConsentCheckbox>

        <ConsentCheckbox
          id="health_data_consent"
          checked={consents.health_data_consent}
          onChange={(v) => consent('health_data_consent', v)}
          error={fieldErrors.health_data_consent}
          required
        >
          I consent to QiFlow storing my wellbeing data to personalise my experience.{' '}
          <span className="text-text-secondary">{HEALTH_DISCLAIMER}</span>
        </ConsentCheckbox>

        <ConsentCheckbox
          id="marketing_consent"
          checked={formData.marketing_consent}
          onChange={(v) => field('marketing_consent', v)}
        >
          Send me seasonal wellness tips and QiFlow updates (optional)
        </ConsentCheckbox>
      </fieldset>

      {refCode && (
        <p className="text-xs text-primary bg-primary/5 rounded-sm px-3 py-2">
          Joining via a friend&apos;s referral link — welcome!
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating your account…' : 'Create account'}
      </Button>

      <p className="text-xs text-text-secondary text-center">{BILLING_PROMISE}</p>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline">Sign in</Link>
      </p>
    </form>
  )
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  required,
  children,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `err-${id}` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-xs text-text-primary leading-snug">{children}</span>
      </label>
      {error && (
        <p id={`err-${id}`} role="alert" className="mt-1 text-xs text-error pl-6">{error}</p>
      )}
    </div>
  )
}
