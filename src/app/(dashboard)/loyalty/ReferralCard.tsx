'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import type { ReferralStats } from '@/lib/loyalty/referral'

interface ReferralCardProps {
  stats: ReferralStats
}

export function ReferralCard({ stats }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(stats.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard API unavailable — fallback: select the input
      const el = document.getElementById('referral-link-input') as HTMLInputElement | null
      el?.select()
    }
  }

  return (
    <Card padding="md" className="space-y-4" role="region" aria-label="Referral programme">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Invite a friend</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Share your link — when your friend joins as a member, you both benefit from QiFlow together.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="referral-link-input"
          type="text"
          readOnly
          value={stats.referral_link}
          aria-label="Your referral link"
          className="flex-1 min-w-0 rounded-sm border border-border bg-surface px-3 py-2 text-xs text-text-secondary font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={copyLink}
          aria-label={copied ? 'Link copied' : 'Copy referral link'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Pending" value={stats.pending} description="Friends who signed up" />
        <StatTile label="Converted" value={stats.converted} description="Friends who became members" />
      </div>

      <p className="text-xs text-text-secondary">
        Your referral code: <span className="font-mono font-semibold text-text-primary">{stats.referral_code}</span>
      </p>
    </Card>
  )
}

function StatTile({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="rounded-sm bg-surface border border-border p-3 text-center">
      <p className="text-2xl font-bold text-primary" aria-label={`${value} ${description}`}>{value}</p>
      <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
      <p className="text-xs text-text-secondary">{description}</p>
    </div>
  )
}
