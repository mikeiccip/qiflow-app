import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const service = createServiceClient()
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const staleIds: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint as string,
        keys: sub.keys as { p256dh: string; auth: string },
      }
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          staleIds.push(sub.id as string)
        } else {
          console.error('[push] send failed:', sub.id, statusCode)
        }
      }
    })
  )

  if (staleIds.length > 0) {
    await service.from('push_subscriptions').delete().in('id', staleIds)
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const service = createServiceClient()
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys')

  if (!subs || subs.length === 0) return { sent: 0, failed: 0 }

  let sent = 0
  let failed = 0
  const staleIds: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint as string,
        keys: sub.keys as { p256dh: string; auth: string },
      }
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) staleIds.push(sub.id as string)
        else failed++
      }
    })
  )

  if (staleIds.length > 0) {
    await service.from('push_subscriptions').delete().in('id', staleIds)
  }

  return { sent, failed }
}
