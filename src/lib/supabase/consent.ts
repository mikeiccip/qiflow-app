import { createServiceClient } from './service'

interface ConsentRecord {
  age_confirmed: boolean
  terms_accepted: boolean
  health_data_consent: boolean
  marketing_consent: boolean
}

export async function recordConsents({
  userId,
  consents,
  ipHash,
}: {
  userId: string
  consents: ConsentRecord
  ipHash?: string
}): Promise<void> {
  const service = createServiceClient()
  await service.from('consent_records').insert({
    user_id: userId,
    ...consents,
    ip_hash: ipHash ?? null,
    consented_at: new Date().toISOString(),
  })
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + (process.env.IP_HASH_SALT ?? 'qiflow'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
