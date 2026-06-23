import { createServiceClient } from '@/lib/supabase/service'

type CapType = 'community_question' | 'seasonal_plan'

const CAP_LIMITS: Record<CapType, number> = {
  community_question: 2,
  seasonal_plan: 1,
}

export async function checkAndIncrementCap(
  userId: string,
  capType: CapType
): Promise<{ allowed: boolean; remaining: number; used: number }> {
  const service = createServiceClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count } = await service
    .from('ai_usage_caps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cap_type', capType)
    .gte('created_at', monthStart.toISOString())

  const used = count ?? 0
  const limit = CAP_LIMITS[capType] ?? 2
  const allowed = used < limit

  if (allowed) {
    await service.from('ai_usage_caps').insert({ user_id: userId, cap_type: capType })
  }

  return { allowed, remaining: Math.max(0, limit - used - (allowed ? 1 : 0)), used }
}

export async function getCapStatus(
  userId: string,
  capType: CapType
): Promise<{ used: number; remaining: number; limit: number }> {
  const service = createServiceClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count } = await service
    .from('ai_usage_caps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cap_type', capType)
    .gte('created_at', monthStart.toISOString())

  const used = count ?? 0
  const limit = CAP_LIMITS[capType] ?? 2
  return { used, remaining: Math.max(0, limit - used), limit }
}
