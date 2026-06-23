import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignupForm } from './SignupForm'

export const metadata: Metadata = {
  title: 'Join QiFlow',
  description: 'Create your QiFlow account and discover your TCM constitution for personalised wellness guidance.',
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
