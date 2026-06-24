import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Analytics — QiFlow Admin' }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString()
  const sevenDaysAgoDate = sevenDaysAgoStr.split('T')[0]

  const [
    totalMembersResult,
    newMembersResult,
    pushSubsResult,
    activeUsersResult,
    recentEventsResult,
    totalUsersResult,
  ] = await Promise.all([
    service
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('membership_status', 'member')
      .is('deleted_at', null),
    service
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('membership_status', 'member')
      .gte('member_since', sevenDaysAgoStr)
      .is('deleted_at', null),
    service
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true }),
    service
      .from('checkins')
      .select('user_id')
      .gte('checkin_date', sevenDaysAgoDate),
    service
      .from('analytics_events')
      .select('event_name, created_at')
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: false })
      .limit(500),
    service
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
  ])

  const totalMembers = totalMembersResult.count ?? 0
  const newMembers = newMembersResult.count ?? 0
  const pushSubs = pushSubsResult.count ?? 0
  const totalUsers = totalUsersResult.count ?? 0
  const activeUsers = new Set(
    (activeUsersResult.data ?? []).map((r) => r.user_id)
  ).size

  // Count events by type
  const eventCounts: Record<string, number> = {}
  for (const row of recentEventsResult.data ?? []) {
    eventCounts[row.event_name] = (eventCounts[row.event_name] ?? 0) + 1
  }
  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Last 7 days</p>
      </div>

      {/* Member metrics */}
      <section aria-label="Member metrics">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
          Members
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total members" value={totalMembers} />
          <StatCard label="New this week" value={newMembers} />
          <StatCard label="Active users" value={activeUsers} sub="Check-ins last 7d" />
          <StatCard label="Total users" value={totalUsers} sub="All signups" />
        </div>
      </section>

      {/* Push subscriptions */}
      <section aria-label="Push notifications">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
          Push Notifications
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Subscriptions" value={pushSubs} sub="Active push endpoints" />
        </div>
      </section>

      {/* Event breakdown */}
      <section aria-label="Event counts">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
          Events — last 7 days
        </h2>
        {topEvents.length === 0 ? (
          <p className="text-sm text-text-secondary">No events recorded yet.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm" aria-label="Event counts table">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Event
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topEvents.map(([event, count]) => (
                  <tr key={event} className="hover:bg-surface-alt/50">
                    <td className="px-4 py-2 font-mono text-xs text-text-primary">{event}</td>
                    <td className="px-4 py-2 text-right text-text-primary font-medium">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AI cost note */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
          AI Costs
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          AI call metrics (model, tokens, cost in pence, latency) are emitted as structured{' '}
          <code className="font-mono text-xs bg-surface-alt px-1 rounded">[AI_METRIC]</code>{' '}
          JSON logs. View them in the Vercel Logs dashboard or export to your preferred log
          aggregator. Each log line contains: task, model, input_tokens, output_tokens,
          cost_pence, latency_ms, success.
        </p>
      </section>
    </div>
  )
}
