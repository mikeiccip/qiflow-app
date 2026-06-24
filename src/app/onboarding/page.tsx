import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { type ConstitutionType } from '@/types'
import { OnboardingWizard } from './OnboardingWizard'

export const metadata: Metadata = { title: 'Welcome to QiFlow' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, onboarding_completed, constitution_primary')
    .eq('id', user.id)
    .single()

  // Already onboarded — skip wizard
  if (profile?.onboarding_completed) redirect('/dashboard')

  return (
    <OnboardingWizard
      fullName={profile?.full_name ?? user.email ?? 'there'}
      constitutionPrimary={(profile?.constitution_primary as ConstitutionType | null) ?? null}
    />
  )
}
