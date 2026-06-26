import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConstitutionQuiz } from './ConstitutionQuiz'

export const metadata: Metadata = {
  title: 'Know your constitution — QiFlow',
}

export default async function ConstitutionPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/constitution')

  const params = await searchParams
  const returnToOnboarding = params.onboarding === '1'

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-text-primary">TCM constitution quiz</h1>
          <p className="text-xs text-text-secondary">20 questions · about 5 minutes</p>
        </div>
        <ConstitutionQuiz returnToOnboarding={returnToOnboarding} />
      </div>
    </div>
  )
}
