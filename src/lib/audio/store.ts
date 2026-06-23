'use client'

import { useSyncExternalStore } from 'react'

interface AudioState {
  url: string | null
  title: string
  articleSlug: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

const INITIAL: AudioState = {
  url: null,
  title: '',
  articleSlug: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
}

let state: AudioState = { ...INITIAL }
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function getSnapshot() {
  return state
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function sessionKey(slug: string) {
  return `qiflow:audio:time:${slug}`
}

function saveTime(slug: string, time: number) {
  try {
    sessionStorage.setItem(sessionKey(slug), String(time))
  } catch {}
}

function restoreTime(slug: string): number {
  try {
    const v = sessionStorage.getItem(sessionKey(slug))
    return v ? parseFloat(v) : 0
  } catch {
    return 0
  }
}

export const audioActions = {
  play(url: string, title: string, slug: string) {
    const restoredTime = restoreTime(slug)
    state = { url, title, articleSlug: slug, isPlaying: true, currentTime: restoredTime, duration: 0 }
    notify()
  },
  pause() {
    if (state.articleSlug) saveTime(state.articleSlug, state.currentTime)
    state = { ...state, isPlaying: false }
    notify()
  },
  resume() {
    state = { ...state, isPlaying: true }
    notify()
  },
  seek(seconds: number) {
    if (state.articleSlug) saveTime(state.articleSlug, seconds)
    state = { ...state, currentTime: seconds }
    notify()
  },
  setCurrentTime(seconds: number) {
    if (state.articleSlug) saveTime(state.articleSlug, seconds)
    state = { ...state, currentTime: seconds }
    notify()
  },
  setDuration(seconds: number) {
    state = { ...state, duration: seconds }
    notify()
  },
}

export function useAudioStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => INITIAL)
}
