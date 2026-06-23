import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = (...parts: string[]) => resolve(__dirname, '../../src', ...parts)

function read(...parts: string[]) {
  return readFileSync(src(...parts), 'utf-8')
}

// ── Signup API ────────────────────────────────────────────────

describe('Signup API route', () => {
  it('uses signupSchema for validation', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('signupSchema')
    expect(content).toContain('safeParse')
  })

  it('calls supabase.auth.signUp', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('supabase.auth.signUp')
  })

  it('creates profile via service client (upsert)', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('createServiceClient')
    expect(content).toContain("from('profiles')")
    expect(content).toContain('.upsert(')
  })

  it('records GDPR consents', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('recordConsents')
  })

  it('hashes IP before storing consent', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('hashIp')
    expect(content).toContain('x-forwarded-for')
  })

  it('claims referral if referred_by present', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('referred_by')
    expect(content).toContain('createReferralRecord')
  })

  it('referral claim is fire-and-forget (non-blocking)', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('.catch(() => {})')
  })

  it('returns 201 on success', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('status: 201')
    expect(content).toContain("success: true")
  })

  it('returns 409 on duplicate email', () => {
    const content = read('app/api/auth/signup/route.ts')
    expect(content).toContain('409')
    expect(content).toContain('already')
  })
})

// ── Signup page ───────────────────────────────────────────────

describe('Signup page', () => {
  it('is a client component', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain("'use client'")
  })

  it('shows all required consent checkboxes', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain('age_confirmed')
    expect(content).toContain('terms_accepted')
    expect(content).toContain('health_data_consent')
    expect(content).toContain('marketing_consent')
  })

  it('health consent includes HEALTH_DISCLAIMER text', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain('HEALTH_DISCLAIMER')
  })

  it('validates with signupSchema before submitting', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain('signupSchema')
    expect(content).toContain('safeParse')
  })

  it('reads referral code from URL params', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain("searchParams.get('ref')")
    expect(content).toContain('referred_by')
  })

  it('redirects to /onboarding on success', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain("router.push('/onboarding')")
  })

  it('uses aria-invalid and aria-describedby for field errors', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain('aria-invalid={!!fieldErrors')
    expect(content).toContain('aria-describedby')
  })

  it('shows BILLING_PROMISE', () => {
    const content = read('app/(auth)/signup/SignupForm.tsx')
    expect(content).toContain('BILLING_PROMISE')
  })
})

// ── Login page ────────────────────────────────────────────────

describe('Login page', () => {
  it('is a client component', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain("'use client'")
  })

  it('uses loginSchema for validation', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain('loginSchema')
  })

  it('calls signInWithPassword client-side', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain('signInWithPassword')
    expect(content).toContain('createClient')
  })

  it('redirects to /dashboard after login (middleware handles onboarding)', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain("router.push('/dashboard')")
  })

  it('shows friendly error for invalid credentials', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain('Email or password is incorrect')
    expect(content).toContain('Invalid login credentials')
  })

  it('has accessible form label', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain('aria-label="Log in to QiFlow"')
  })

  it('links to /signup', () => {
    const content = read('app/(auth)/login/LoginForm.tsx')
    expect(content).toContain('href="/signup"')
  })
})

// ── Onboarding complete API ───────────────────────────────────

describe('Onboarding complete API', () => {
  it('requires auth (401 without user)', () => {
    const content = read('app/api/onboarding/complete/route.ts')
    expect(content).toContain('401')
    expect(content).toContain('Unauthorised')
  })

  it('sets onboarding_completed = true', () => {
    const content = read('app/api/onboarding/complete/route.ts')
    expect(content).toContain('onboarding_completed: true')
    expect(content).toContain('.update(')
  })

  it('uses service client for write', () => {
    const content = read('app/api/onboarding/complete/route.ts')
    expect(content).toContain('createServiceClient')
  })
})

// ── Onboarding page (server) ──────────────────────────────────

describe('Onboarding server page', () => {
  it('redirects to /signup if no user', () => {
    const content = read('app/onboarding/page.tsx')
    expect(content).toContain("redirect('/signup')")
  })

  it('redirects to /dashboard if already onboarded', () => {
    const content = read('app/onboarding/page.tsx')
    expect(content).toContain('onboarding_completed')
    expect(content).toContain("redirect('/dashboard')")
  })

  it('passes fullName and constitutionPrimary to wizard', () => {
    const content = read('app/onboarding/page.tsx')
    expect(content).toContain('fullName')
    expect(content).toContain('constitutionPrimary')
    expect(content).toContain('OnboardingWizard')
  })
})

// ── Onboarding wizard (client) ────────────────────────────────

describe('OnboardingWizard', () => {
  it('is a client component', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain("'use client'")
  })

  it('has 4 steps: welcome, constitution, membership, complete', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain("'welcome'")
    expect(content).toContain("'constitution'")
    expect(content).toContain("'membership'")
    expect(content).toContain("'complete'")
  })

  it('shows progress indicator with aria attributes', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('progressbar')
    expect(content).toContain('aria-valuemin')
    expect(content).toContain('aria-valuenow')
  })

  it('shows constitution result if already completed', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('constitutionPrimary')
    expect(content).toContain('CONSTITUTION_LABELS')
  })

  it('links to /constitution?onboarding=1 for quiz', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('/constitution?onboarding=1')
  })

  it('shows BILLING_PROMISE on membership step', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('BILLING_PROMISE')
    expect(content).toContain('/subscribe')
  })

  it('shows HEALTH_DISCLAIMER on complete step', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('HEALTH_DISCLAIMER')
  })

  it('calls /api/onboarding/complete on finish', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('/api/onboarding/complete')
    expect(content).toContain("method: 'POST'")
  })

  it('redirects to /dashboard after completion', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain("router.push('/dashboard')")
    expect(content).toContain('router.refresh()')
  })

  it('has role=alert on error message', () => {
    const content = read('app/onboarding/OnboardingWizard.tsx')
    expect(content).toContain('role="alert"')
  })
})

// ── Middleware ─────────────────────────────────────────────────

describe('Middleware — onboarding gate', () => {
  it('checks onboarding_completed for dashboard routes', () => {
    const content = read('middleware.ts')
    expect(content).toContain('onboarding_completed')
    expect(content).toContain('/onboarding')
  })

  it('redirects unonboarded users to /onboarding', () => {
    const content = read('middleware.ts')
    expect(content).toContain("redirect(new URL('/onboarding'")
  })

  it('protects /onboarding — redirects unauthenticated to /signup', () => {
    const content = read('middleware.ts')
    expect(content).toContain("pathname === '/onboarding'")
    expect(content).toContain("redirect(new URL('/signup'")
  })

  it('redirects authed users from /login to /onboarding if not yet completed', () => {
    const content = read('middleware.ts')
    expect(content).toContain("pathname === '/login'")
    expect(content).toContain('onboarding_completed')
    expect(content).toContain("'/onboarding'")
  })

  it('still redirects authed + onboarded users from /login to /dashboard', () => {
    const content = read('middleware.ts')
    expect(content).toContain("'/dashboard'")
  })

  it('still protects /admin routes with role check', () => {
    const content = read('middleware.ts')
    expect(content).toContain("pathname.startsWith('/admin')")
    expect(content).toContain("role !== 'admin'")
  })

  it('uses Supabase SSR createServerClient', () => {
    const content = read('middleware.ts')
    expect(content).toContain('createServerClient')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
  })
})

// ── Auth layout ───────────────────────────────────────────────

describe('Auth layout', () => {
  it('renders a centered wrapper', () => {
    const content = read('app/(auth)/layout.tsx')
    expect(content).toContain('min-h-screen')
    expect(content).toContain('justify-center')
    expect(content).toContain('max-w-sm')
  })

  it('shows QiFlow brand name', () => {
    const content = read('app/(auth)/layout.tsx')
    expect(content).toContain('QiFlow')
  })
})
