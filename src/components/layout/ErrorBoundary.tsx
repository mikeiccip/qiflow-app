'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  eventId: string | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, eventId: null }

  static getDerivedStateFromError(): State {
    return { hasError: true, eventId: null }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    })
    this.setState({ eventId: typeof eventId === 'string' ? eventId : null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
            role="alert"
          >
            <p className="text-4xl mb-4" aria-hidden="true">🌿</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-4 max-w-xs leading-relaxed">
              We&apos;ve been notified and will look into it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, eventId: null })}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary hover:border-primary transition-colors"
              >
                Home
              </Link>
            </div>
            {this.state.eventId && (
              <p className="mt-3 text-xs text-text-secondary">
                Ref: {this.state.eventId}
              </p>
            )}
          </div>
        )
      )
    }
    return this.props.children
  }
}
