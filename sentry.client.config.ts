import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  // Capture 10% of sessions for performance monitoring — increase after launch
  tracesSampleRate: 0.1,

  // Capture 5% of sessions for session replay
  replaysSessionSampleRate: 0.05,
  // Capture 100% of sessions where an error occurs
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media — user health data must never appear in replays
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    // Strip any request body from error events — may contain health data
    if (event.request?.data) {
      delete event.request.data
    }
    return event
  },
})
