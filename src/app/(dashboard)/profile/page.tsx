import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui'
import { CONSTITUTION_LABELS, HEALTH_DISCLAIMER, type ConstitutionType } from '@/types'
import { formatDate } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'
import { PushPermission } from '@/components/pwa/PushPermission'

export const metadata: Metadata = {
  title: 'Profile — QiFlow',
  description: 'Manage your account, constitution profile, and notification preferences.',
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  free: 'Free',
  member: 'Member',
  paused: 'Paused',
  cancelled: 'Cancelled',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, membership_status, constitution_primary, member_since, referral_code')
    .eq('id', user.id)
    .single()

  const constitutionType = profile?.constitution_primary as ConstitutionType | null
  const constitutionLabel = constitutionType ? CONSTITUTION_LABELS[constitutionType] : null
  const membershipStatus = profile?.membership_status ?? 'free'
  const isMember = ['member', 'paused'].includes(membershipStatus)
  const initials = (profile?.full_name ?? user.email ?? '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-4 px-4 py-4">

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">
              {profile?.full_name ?? 'No name set'}
            </p>
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
          </div>
        </div>

        {/* Membership status */}
        <Card padding="md" className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Membership
          </h2>
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-medium ${isMember ? 'text-success' : 'text-text-secondary'}`}
              aria-label={`Membership status: ${MEMBERSHIP_LABELS[membershipStatus] ?? membershipStatus}`}
            >
              {MEMBERSHIP_LABELS[membershipStatus] ?? membershipStatus}
            </span>
            {!isMember && (
              <Link
                href="/subscribe"
                className="text-xs text-primary hover:underline"
              >
                Upgrade →
              </Link>
            )}
            {isMember && (
              <Link
                href="/subscribe/manage"
                className="text-xs text-text-secondary hover:text-primary"
              >
                Manage
              </Link>
            )}
          </div>
          {profile?.member_since && isMember && (
            <p className="text-xs text-text-secondary">
              Member since {formatDate(profile.member_since)}
            </p>
          )}
        </Card>

        {/* Constitution */}
        <Card padding="md" className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            TCM Constitution
          </h2>
          {constitutionLabel ? (
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: constitutionLabel.color }}
                >
                  {constitutionLabel.en}
                </p>
                <p className="text-xs text-text-secondary">{constitutionLabel.zh}</p>
              </div>
              <Link
                href="/constitution"
                className="text-xs text-text-secondary hover:text-primary"
              >
                Retake quiz
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Not yet assessed</p>
              <Link href="/constitution" className="text-xs text-primary hover:underline">
                Take quiz →
              </Link>
            </div>
          )}
        </Card>

        {/* Referral code */}
        {profile?.referral_code && (
          <Card padding="md" className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Referral code
            </h2>
            <p
              className="font-mono text-sm text-primary select-all"
              aria-label={`Your referral code: ${profile.referral_code}`}
            >
              {profile.referral_code}
            </p>
            <Link href="/loyalty" className="text-xs text-text-secondary hover:text-primary">
              View referral programme →
            </Link>
          </Card>
        )}

        {/* Account actions */}
        <Card padding="md" className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Account
          </h2>
          <Link
            href="/profile/change-password"
            className="block text-sm text-text-primary hover:text-primary transition-colors py-1"
          >
            Change password →
          </Link>
          <Link
            href="/profile/delete-account"
            className="block text-sm text-error/70 hover:text-error transition-colors py-1"
          >
            Delete account
          </Link>
        </Card>

        {/* Notification settings */}
        <Card padding="md" className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Notifications
          </h2>
          <PushPermission />
        </Card>

        {/* Sign out */}
        <SignOutButton />

        {/* Health disclaimer */}
        <p className="text-[10px] text-text-secondary text-center leading-relaxed px-2">
          {HEALTH_DISCLAIMER}
        </p>

      </div>
    </DashboardLayout>
  )
}
