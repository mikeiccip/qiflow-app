'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui'
import { Button } from '@/components/ui'
import { toast } from '@/components/ui'
import { enqueueCheckin } from '@/lib/offline/checkinQueue'
import { cn } from '@/lib/utils'

const MOODS = [
  { emoji: '😢', label: 'Very low' },
  { emoji: '😕', label: 'Low' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😄', label: 'Great' },
] as const

type MoodEmoji = typeof MOODS[number]['emoji']

interface CheckInFormProps {
  todayDate: string
  existingCheckin?: {
    pain: number
    energy: number
    sleep: number
    mood: string
    note: string | null
  }
  onSaved?: () => void
}

export function CheckInForm({ todayDate, existingCheckin, onSaved }: CheckInFormProps) {
  const [pain, setPain] = useState(existingCheckin?.pain ?? 0)
  const [energy, setEnergy] = useState(existingCheckin?.energy ?? 5)
  const [sleep, setSleep] = useState(existingCheckin?.sleep ?? 5)
  const [mood, setMood] = useState<MoodEmoji>(
    (existingCheckin?.mood as MoodEmoji) ?? '😐'
  )
  const [note, setNote] = useState(existingCheckin?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [savedOffline, setSavedOffline] = useState(false)

  async function submit() {
    setSaving(true)
    const payload = {
      checkin_date: todayDate,
      pain,
      energy,
      sleep,
      mood,
      note: note.trim() || null,
    }

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Check-in saved!')
        setSavedOffline(false)
        onSaved?.()
      } else {
        throw new Error('Server error')
      }
    } catch {
      // Offline or server error — queue locally
      await enqueueCheckin(payload)
      setSavedOffline(true)
      toast.success('Saved offline — will sync when you reconnect')
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit() }}
      className="space-y-5"
      aria-label="Daily check-in form"
    >
      {savedOffline && (
        <div
          role="status"
          className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-btn px-3 py-2"
        >
          Saved offline · will sync when you&rsquo;re back online
        </div>
      )}

      {/* Pain */}
      <Slider
        label="Pain level"
        name="pain"
        min={0}
        max={10}
        value={pain}
        onChange={setPain}
        hint="0 = no pain · 10 = severe"
        valueLabel={(v) => v === 0 ? 'None' : String(v)}
      />

      {/* Energy */}
      <Slider
        label="Energy"
        name="energy"
        min={0}
        max={10}
        value={energy}
        onChange={setEnergy}
        hint="0 = exhausted · 10 = excellent"
      />

      {/* Sleep quality */}
      <Slider
        label="Sleep quality"
        name="sleep"
        min={0}
        max={10}
        value={sleep}
        onChange={setSleep}
        hint="0 = very poor · 10 = excellent"
      />

      {/* Mood */}
      <fieldset>
        <legend className="text-sm font-medium text-text-primary mb-2">Mood</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Select mood">
          {MOODS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={mood === emoji}
              aria-label={label}
              onClick={() => setMood(emoji)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 rounded-btn border text-xl transition-colors',
                'min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                mood === emoji
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-200 bg-surface hover:border-primary/40'
              )}
            >
              <span aria-hidden="true">{emoji}</span>
              <span className="text-xs text-text-secondary mt-0.5 hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Note */}
      <div className="space-y-1">
        <label htmlFor="note" className="text-sm font-medium text-text-primary">
          Note <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How are you feeling today?"
          className="w-full rounded-btn border border-gray-200 px-3 py-2 text-sm text-text-primary
                     placeholder:text-text-secondary resize-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="text-xs text-text-secondary text-right">{note.length}/500</p>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={saving}
        aria-label="Save today's check-in"
      >
        {existingCheckin ? 'Update check-in' : 'Save check-in'}
      </Button>
    </form>
  )
}
