'use client'

import { useState, useEffect, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

type ToastListener = (msg: ToastMessage) => void

let _id = 0
const listeners: ToastListener[] = []

function emit(type: ToastType, message: string) {
  const msg: ToastMessage = { id: ++_id, type, message }
  listeners.forEach((l) => l(msg))
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const listener: ToastListener = (msg) => {
      setToasts((prev) => [...prev, msg])
      setTimeout(() => remove(msg.id), 4000)
    }
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }, [remove])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-3 rounded-card px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === 'success' ? 'bg-primary text-white' :
            t.type === 'error' ? 'bg-red-600 text-white' :
            'bg-gray-800 text-white'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            aria-label="Dismiss"
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
