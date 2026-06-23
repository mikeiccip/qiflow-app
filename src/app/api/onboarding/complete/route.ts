import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })

  return NextResponse.json({ success: true })
}
