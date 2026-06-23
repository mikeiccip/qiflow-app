'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CONSTITUTION_LABELS, type ConstitutionType } from '@/types'

const CATEGORIES = ['All', 'Seasonal', 'Constitution', 'Food Therapy', 'Lifestyle', 'Remedies'] as const

export function LibraryFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? 'All'
  const activeConstitution = (searchParams.get('constitution') ?? '') as ConstitutionType | ''

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === 'All') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setParam('category', cat)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150',
                'min-h-[44px] min-w-[44px]',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-gray-200 text-text-secondary hover:border-primary hover:text-primary'
              )}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Constitution dropdown */}
      <select
        aria-label="Filter by constitution type"
        value={activeConstitution}
        onChange={(e) => setParam('constitution', e.target.value)}
        className={cn(
          'w-full rounded-btn border border-gray-200 bg-surface px-3 py-2.5 text-sm',
          'text-text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
          'min-h-[44px]',
          activeConstitution ? 'border-primary text-primary' : ''
        )}
      >
        <option value="">All constitution types</option>
        {(Object.entries(CONSTITUTION_LABELS) as [ConstitutionType, { en: string; zh: string }][]).map(
          ([key, label]) => (
            <option key={key} value={key}>
              {label.en} ({label.zh})
            </option>
          )
        )}
      </select>
    </div>
  )
}
