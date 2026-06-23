'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DayFocus {
  day: number
  morning_tip: string
  food_tip: string
  evening_tip: string
}

interface DayCardsProps {
  days: DayFocus[]
  termStartDate: string
}

function formatDayDate(termStart: string, dayIndex: number): string {
  const d = new Date(termStart)
  d.setDate(d.getDate() + dayIndex)
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(d)
}

export function DayCards({ days, termStartDate }: DayCardsProps) {
  const [activeDay, setActiveDay] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToDay(index: number) {
    const container = scrollRef.current
    if (!container) return
    const card = container.children[index] as HTMLElement
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
    setActiveDay(index)
  }

  // Update active indicator on scroll
  function handleScroll() {
    const container = scrollRef.current
    if (!container) return
    const cardWidth = container.clientWidth
    const scrollLeft = container.scrollLeft
    const index = Math.round(scrollLeft / cardWidth)
    setActiveDay(index)
  }

  return (
    <section aria-label="Daily focus cards" className="space-y-3">
      <h2 className="text-sm font-semibold text-text-primary">7-Day Focus</h2>

      {/* Day tab buttons */}
      <div
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
        role="tablist"
        aria-label="Select day"
      >
        {days.map((d, i) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={activeDay === i}
            aria-controls={`day-panel-${i}`}
            id={`day-tab-${i}`}
            onClick={() => scrollToDay(i)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              'min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              activeDay === i
                ? 'bg-primary text-white'
                : 'bg-surface border border-gray-200 text-text-secondary hover:border-primary'
            )}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      {/* Swipeable card container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide gap-3"
        aria-live="polite"
      >
        {days.map((d, i) => (
          <div
            key={d.day}
            id={`day-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`day-tab-${i}`}
            aria-hidden={activeDay !== i}
            className="snap-start shrink-0 w-full bg-surface rounded-card shadow-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Day {d.day}
              </span>
              <span className="text-xs text-text-secondary">
                {formatDayDate(termStartDate, i)}
              </span>
            </div>

            <TipRow icon="🌅" label="Morning" tip={d.morning_tip} />
            <TipRow icon="🥢" label="Food" tip={d.food_tip} />
            <TipRow icon="🌙" label="Evening" tip={d.evening_tip} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {days.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToDay(i)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i === activeDay ? 'bg-primary' : 'bg-gray-200'
            )}
            tabIndex={-1}
          />
        ))}
      </div>
    </section>
  )
}

function TipRow({ icon, label, tip }: { icon: string; label: string; tip: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-text-primary leading-relaxed">{tip}</p>
      </div>
    </div>
  )
}
