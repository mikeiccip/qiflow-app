'use client'

import { openDB, type IDBPDatabase } from 'idb'

interface QueuedCheckin {
  id: string
  checkin_date: string
  pain: number
  energy: number
  sleep: number
  mood: string
  note: string | null
  queued_at: number
}

interface CheckinQueueDB {
  checkin_queue: {
    key: string
    value: QueuedCheckin
    indexes: { by_date: string }
  }
}

let dbPromise: Promise<IDBPDatabase<CheckinQueueDB>> | null = null

function getDB() {
  if (typeof window === 'undefined') throw new Error('IndexedDB only available in browser')
  if (!dbPromise) {
    dbPromise = openDB<CheckinQueueDB>('qiflow-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('checkin_queue', { keyPath: 'id' })
        store.createIndex('by_date', 'checkin_date')
      },
    })
  }
  return dbPromise
}

export async function enqueueCheckin(checkin: Omit<QueuedCheckin, 'id' | 'queued_at'>) {
  const db = await getDB()
  const item: QueuedCheckin = {
    ...checkin,
    id: `${checkin.checkin_date}:${Date.now()}`,
    queued_at: Date.now(),
  }
  await db.put('checkin_queue', item)
  return item.id
}

export async function getPendingCheckins(): Promise<QueuedCheckin[]> {
  const db = await getDB()
  return db.getAll('checkin_queue')
}

export async function removeFromQueue(id: string) {
  const db = await getDB()
  await db.delete('checkin_queue', id)
}

export async function drainQueue(
  submitFn: (checkin: Omit<QueuedCheckin, 'id' | 'queued_at'>) => Promise<boolean>
): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0
  const pending = await getPendingCheckins()

  for (const item of pending) {
    const { id, queued_at, ...payload } = item
    const ok = await submitFn(payload)
    if (ok) {
      await removeFromQueue(id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}
