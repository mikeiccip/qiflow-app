import { createServiceClient } from '@/lib/supabase/service'

// Only these property keys are stored — guards against accidental PII or health data leakage
const ALLOWED_PROPERTY_KEYS = [
  'content_id',
  'content_type',
  'source',
  'constitution',
  'milestone',
  'solar_term',
  'category',
  'count',
  'from',
  'slug',
] as const

/**
 * Track a server-side analytics event.
 * Fire-and-forget — never throws, never blocks business logic.
 * Never pass health data, email addresses, or mood values as properties.
 */
export async function track(
  userId: string | null,
  event: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    const service = createServiceClient()
    const safe: Record<string, string> = {}
    for (const key of ALLOWED_PROPERTY_KEYS) {
      if (key in properties && properties[key] != null) {
        safe[key] = String(properties[key]).slice(0, 200)
      }
    }
    await service.from('analytics_events').insert({
      user_id: userId,
      event_name: event.slice(0, 100),
      properties: safe,
    })
  } catch {
    // Silently swallow — analytics failure must never affect the user experience
  }
}
