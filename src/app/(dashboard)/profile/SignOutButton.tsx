'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full rounded-full border border-error px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5 transition-colors duration-200 disabled:opacity-50"
      aria-label="Sign out of QiFlow"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
