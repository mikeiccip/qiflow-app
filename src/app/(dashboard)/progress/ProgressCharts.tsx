'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

interface CheckinPoint {
  checkin_date: string
  pain: number
  energy: number
  sleep: number
}

interface ProgressChartsProps {
  data: CheckinPoint[]
}

type Range = 7 | 30

export function ProgressCharts({ data }: ProgressChartsProps) {
  const [range, setRange] = useState<Range>(7)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - range)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filtered = data
    .filter((d) => d.checkin_date >= cutoffStr)
    .map((d) => ({
      date: d.checkin_date.slice(5), // MM-DD
      Pain: d.pain,
      Energy: d.energy,
      Sleep: d.sleep,
    }))

  const isEmpty = filtered.length === 0

  return (
    <section aria-label="Progress charts" className="space-y-3">
      {/* Range toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Trends</h2>
        <div className="flex gap-1" role="group" aria-label="Chart range">
          {([7, 30] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                'min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                range === r
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-gray-200 text-text-secondary hover:border-primary'
              )}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-36 text-sm text-text-secondary rounded-card bg-surface border border-gray-100">
          No check-ins in the last {range} days
        </div>
      ) : (
        <div className="bg-surface rounded-card p-3 shadow-card" aria-hidden="true">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filtered} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 5, 10]}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="Energy"
                stroke="#0D6B6E"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Sleep"
                stroke="#B8860B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Pain"
                stroke="#C0392B"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary text-center mt-1">
            Pain shown dashed · lower is better
          </p>
        </div>
      )}
    </section>
  )
}
