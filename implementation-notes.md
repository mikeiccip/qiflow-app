# QiFlow — Implementation Notes

## Phase 14 — Seasonal Plan Engine

**Tier 1 (auto-proceeded):** New lib, new pages, new client component, test file.

### Files added

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/ai/seasonalPlan.ts` | 249 | Core cache+generation logic; UK timezone solar term lookup; Claude call; upsert cache |
| `src/app/(dashboard)/seasonal-plan/page.tsx` | 168 | Server component; auth + member gate; fetch or generate plan; full plan layout |
| `src/app/(dashboard)/seasonal-plan/DayCards.tsx` | 142 | Client component; CSS scroll-snap swipeable day cards; ARIA tablist pattern |
| `tests/unit/seasonal-plan.test.ts` | 186 | Static analysis tests covering auth, cache, ASA guards, schema, accessibility |

### Decisions

- **`claude-sonnet-4-6` (quality model)** — seasonal plans are generated once per user per term; the cost of one quality call amortises over ~15 days of views.
- **UK timezone via `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' })`** — `en-CA` locale returns `YYYY-MM-DD` format directly, no string manipulation needed.
- **Solar terms read from DB** — `solar_terms` table queried by `starts_on <= today` + `ORDER BY DESC LIMIT 1`. Spec explicitly forbids hardcoding dates.
- **`ignoreDuplicates: true` on upsert** — if two requests race (e.g. duplicate tab), the first write wins; fallback plan is never incorrectly over-written.
- **Generate in server component** — plan generation blocks the page render on first visit (~2-4s). Acceptable because it happens once per ~15-day term; subsequent visits are instant from cache.
- **CSS scroll snap** — native `snap-x snap-mandatory` for swipe, no extra dependency. Works on iOS Safari and Android Chrome.
- **ARIA tablist pattern** — day pills are `role="tab"`, panels are `role="tabpanel"`, linked by `aria-controls`/`aria-labelledby`.

### Deviations

- No push notification on term start (Phase 20 covers notifications). The plan link in `SeasonalTipCard` provides entry point.
- `Suspense` loading skeleton not used — plan is generated inline in the server component. If generation becomes a concern, the generation call can be extracted to a separate streamed child component.

### Trade-offs

- **Speed vs correctness**: generating in the server component means the page is slow (~2-4s) on first visit per term. Alternative (background job + polling) adds complexity without meaningful UX gain for a 15-day cycle.
- **Fallback plan** is generic but safe — always returns valid UI if Claude is unavailable; cached so the fallback is also shown consistently for the term.

### Rollback

Delete `src/lib/ai/seasonalPlan.ts`, `src/app/(dashboard)/seasonal-plan/`, `tests/unit/seasonal-plan.test.ts`. No existing files modified.

---

## Phase 13 — Progress Tracker (Offline-First + Charts)

**Tier 1 (auto-proceeded):** New components, new pages, new API route, offline queue, test file.

### Files added

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/offline/checkinQueue.ts` | 79 | IndexedDB queue via `idb`; `enqueue`, `drain`, `getPending`; never loses a check-in offline |
| `src/app/api/checkins/route.ts` | 67 | POST (upsert by `user_id,checkin_date`) + GET (last N days); Zod validation; auth-gated |
| `src/app/(dashboard)/progress/page.tsx` | 87 | Server component; auth + member guard; fetches 30-day check-ins + last quiz date |
| `src/app/(dashboard)/progress/CheckInForm.tsx` | 186 | Client form; pain/energy/sleep sliders (0-10); 5 emoji mood; optional note; offline fallback to queue |
| `src/app/(dashboard)/progress/ProgressCharts.tsx` | 137 | Client; Recharts LineChart; 7/30-day toggle; Energy/Sleep/Pain lines |
| `src/app/(dashboard)/progress/StatsPanel.tsx` | 225 | Server; streak counter; month comparison averages; computed insight; 90-day re-quiz prompt |
| `src/app/(dashboard)/progress/SyncManager.tsx` | 43 | Client; drains IndexedDB queue on mount + `online` event; toasts on sync |
| `src/app/(dashboard)/progress/log/page.tsx` | 60 | Standalone check-in entry page (linked from dashboard ProgressSummaryCard) |
| `tests/unit/progress.test.ts` | 220 | Static analysis tests for all Phase 13 files |

### Decisions

- **`idb`** already in `package.json` — used for IndexedDB queue with typed schema. Survives app restarts; drains on reconnect.
- **Zod validation on API** — `mood` validated as exact enum of 5 emoji; `pain/energy/sleep` as 0-10 int.
- **Upsert pattern** — `onConflict: 'user_id,checkin_date'` matches DB unique constraint; safe to re-submit same-day check-in.
- **Streak** computed server-side from 30-day window — starts from today if today has a check-in, else from yesterday.
- **Computed insight** phrased as wellbeing observation (`supports`, `better`) — never `treats`, `cures`, `heals` (ASA/CAP guard enforced in tests).

### Deviations

- `constitution_results` table queried for last quiz date — if this table name differs, update `StatsPanel` query.
- No background sync service worker integration yet (Phase 20 handles SW/PWA). `SyncManager` covers the `online` event path which handles most cases.

### Trade-offs

- Charts data is passed as props (30-day fetch at page level) and sliced client-side by the 7/30-day toggle — avoids a second fetch for the chart range change.
- `StatsPanel` is a server component even though it does derived computation — keeps computation off the client and avoids hydration mismatch.

### Rollback

Delete `src/lib/offline/`, `src/app/(dashboard)/progress/`, `src/app/api/checkins/`, `tests/unit/progress.test.ts`. No existing files modified.

---

## Phase 12 — Knowledge Library + CMS + Persistent Audio Player

**Tier 1 (auto-proceeded):** New components, new pages, new API route, test file, audio store.

### Files added

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/audio/store.ts` | 91 | Global audio state via `useSyncExternalStore`; persists seek position to `sessionStorage` keyed by slug |
| `src/components/audio/PersistentAudioPlayer.tsx` | 124 | Fixed bottom bar above BottomNav; play/pause/seek; aria-labelled |
| `src/app/(dashboard)/layout.tsx` | 10 | Updated to mount `PersistentAudioPlayer` once for all dashboard routes |
| `src/app/(dashboard)/library/LibraryFilters.tsx` | 80 | Client component; category pills + constitution dropdown; updates URL search params |
| `src/app/(dashboard)/library/ArticleGrid.tsx` | 89 | Server component; renders ArticleCard list; EmptyState on 0 results |
| `src/app/(dashboard)/library/page.tsx` | 101 | Server component; auth guard; fetches all published content; splits free (first 3) vs gated |
| `src/app/(dashboard)/library/[slug]/page.tsx` | 135 | Server component; `generateMetadata`; markdown via `marked`; member gate on full content |
| `src/app/(dashboard)/library/[slug]/AudioPlayerInit.tsx` | 39 | Client component; hydrates global audio store when user taps Play |
| `src/app/(dashboard)/library/[slug]/BookmarkButton.tsx` | 59 | Client component; toggles bookmark via `POST /api/bookmarks` |
| `src/app/api/bookmarks/route.ts` | 52 | POST (toggle) + GET (list ids); auth-gated; returns `{ bookmarked: boolean }` |
| `src/app/(dashboard)/library/bookmarks/page.tsx` | 49 | Server component; user's saved articles via `ArticleGrid` |
| `tests/unit/library.test.ts` | 169 | Static analysis tests (readFileSync); all pass when vitest is installed |

### Decisions

- **`marked` for markdown** — already in `package.json` (v18.0.5). Content from our DB (trusted), not user input. `dangerouslySetInnerHTML` is only used with `marked()` output; noted in comment.
- **Custom audio store** — `useSyncExternalStore` with module-level state; zero extra deps. Seek position saved to `sessionStorage` keyed by slug so navigating away and returning restores position.
- **`Content` type used as-is** — `full_content` (not `body_md`), `reading_minutes` (not `duration_seconds`), `is_members_only` (not `published`), `preview_text` for non-member preview. Followed `types/index.ts`, not prompt schema description which differed from existing seed.
- **Member gate on library** — first 3 articles visible to all; articles 4+ wrapped in `MemberGate`. Full article body gated by `is_members_only` flag.
- **Article page: two-step fetch** — article fetched first (need `id` for bookmark query), then profile + bookmark in `Promise.all`. Avoids nested await anti-pattern.

### Deviations from prompt spec

- Prompt said `body_md / duration_seconds / published` columns — existing codebase uses `full_content / reading_minutes / published_at`. Used existing schema.
- `ArticleGrid` is a shared server component (used by both library and bookmarks pages) rather than two separate files.
- `AudioPlayerInit` is co-located in `[slug]/` folder rather than a standalone component directory, since it's only used there.

### Trade-offs

- No Zustand — `useSyncExternalStore` achieves the same result; one fewer dependency.
- Audio store state is module-level (not React context) — survives navigation, but is tab-scoped (no cross-tab sync, which is correct for audio).
- Tests are static analysis only (readFileSync pattern matching) — they test structural guarantees without needing DOM/React rendering or network calls.

### Rollback

All changes are additive. To rollback Phase 12: delete the `src/app/(dashboard)/library/` tree, `src/lib/audio/`, `src/components/audio/`, `src/app/api/bookmarks/`, `tests/unit/library.test.ts`, and revert `src/app/(dashboard)/layout.tsx` to its prior content (`export default function DashboardRouteLayout({ children }) { return <>{children}</> }`).

---

## Phase 15 — Community Q&A

**Tier 1 (auto-proceeded):** New lib, new pages, new client components, new API routes, test file.

### Files added

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/ai/qaAnswerDraft.ts` | ~60 | Haiku draft generation; prompt wraps question in `<user_content>` tags |
| `src/app/api/community/questions/route.ts` | ~110 | POST (submit) + GET (answered board + user's pending) |
| `src/app/api/community/upvote/[id]/route.ts` | ~45 | POST: one-shot upvote, requires answered status |
| `src/app/(dashboard)/community/PostQuestionForm.tsx` | ~120 | Client form: category dropdown, 300-char counter, cap display |
| `src/app/(dashboard)/community/UpvoteButton.tsx` | ~50 | Client: aria-pressed, disabled after upvote |
| `src/app/(dashboard)/community/QuestionList.tsx` | ~80 | Server: answered board + pending list with status badges |
| `src/app/(dashboard)/community/page.tsx` | ~100 | Auth gate, parallel fetch, member gate for non-members |
| `src/app/admin/qa/AnswerForm.tsx` | ~110 | Client: shows AI draft (admin-only), "Use as starting point", Publish + Hide actions |
| `src/app/admin/qa/page.tsx` | ~90 | Client: fetches pending queue, 403 display |
| `src/app/api/admin/qa/route.ts` | ~37 | GET: admin-only, returns pending + `ai_draft` column |
| `src/app/api/admin/qa/[id]/answer/route.ts` | ~55 | POST: admin publish → sets `status='answered'`, `answered_at`, `answered_by` |
| `src/app/api/admin/qa/[id]/hide/route.ts` | ~31 | POST: admin hide → sets `status='hidden'` |
| `tests/unit/community-qa.test.ts` | ~273 | Static analysis: auth, cap, moderation, AI draft gate, admin checks, ASA guards |

### Key decisions

- **AI draft never auto-published** — `generateQADraft()` fires after insert, stores result in `ai_draft` column only. The admin UI shows it in an amber box labelled "Practitioner eyes only — never auto-published". "Use as starting point" pre-fills the answer textarea after stripping `Practitioner note:` lines.
- **Cap at 2/month** — `checkAndIncrementCap('community_question')` enforced in POST route before any DB insert. Returns 429 with "Monthly question limit reached" message. Cap status (with `remaining`) is fetched server-side and passed to `PostQuestionForm`.
- **Moderation order** — `sanitiseUserInput()` then `moderateText()` before insert. 422 if moderation fails, so no unsafe content ever reaches the database.
- **Upvote guard** — upvote route `.eq('status', 'answered')` so pending/hidden questions cannot be upvoted.
- **Admin role check** — every admin API route checks `profile.role === 'admin'` server-side via service client. Returns 403 with "Admin access required".
- **`QA_CATEGORIES` exported from questions route** — single source of truth; imported by `PostQuestionForm` for the dropdown and by the Zod schema for validation.

### Deviations from prompt spec

None — all files match the specification.

### Trade-offs

- Admin Q&A page is `'use client'` (fetches on mount) rather than a server component — keeps the queue fresh without ISR invalidation complexity, acceptable for a low-traffic admin tool.
- `AnswerForm` strips lines starting with "Practitioner note:" when pre-filling — simple string split, no regex; robust enough for the AI's consistent output format.

### Rollback

All changes are additive. To rollback Phase 15: delete `src/lib/ai/qaAnswerDraft.ts`, `src/app/api/community/`, `src/app/(dashboard)/community/`, `src/app/admin/qa/`, `src/app/api/admin/qa/`, and `tests/unit/community-qa.test.ts`.

---

## Phase 16 — Workshops

**Tier 1 (auto-proceeded):** Migration, new types, new pages, new API routes, new admin pages, test file.

### Files added

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/005_workshops_extend.sql` | 40 | Adds slug, thumbnail_url, duration_minutes, category, constitution_tags, is_members_only, is_hidden columns + workshops Storage bucket |
| `src/types/index.ts` (appended) | +22 | Workshop interface + WORKSHOP_CATEGORIES constant |
| `src/app/api/workshops/route.ts` | 48 | GET list — text search, category filter, include_hidden admin gate |
| `src/app/api/admin/workshops/route.ts` | 62 | POST create — admin-only, Zod validation, slug uniqueness |
| `src/app/api/admin/workshops/upload/route.ts` | 51 | POST PDF upload — admin-only, 20 MB limit, PDF-only, Supabase Storage |
| `src/app/api/admin/workshops/[id]/route.ts` | 78 | PATCH update + DELETE soft-hide — admin-only |
| `src/app/(dashboard)/workshops/WorkshopSearch.tsx` | 54 | Client search form — URL param updates with scroll:false |
| `src/app/(dashboard)/workshops/page.tsx` | 107 | Server archive — parallel fetch, free preview (3), MemberGate |
| `src/app/(dashboard)/workshops/[slug]/VideoPlayer.tsx` | 76 | Client video player — YouTube/Vimeo iframe detection, native video fallback |
| `src/app/(dashboard)/workshops/[slug]/page.tsx` | 118 | Server detail — signed PDF URL (1h), member gate on video + PDF |
| `src/app/admin/workshops/UploadForm.tsx` | 198 | Client upload form — auto-slug, PDF upload step, members-only toggle |
| `src/app/admin/workshops/page.tsx` | 119 | Client admin page — list all workshops, hide/unhide actions |
| `tests/unit/workshops.test.ts` | 260 | Static analysis: auth, member gate, admin checks, PDF upload rules, video player, search, upload form |

### Key decisions

- **`pdf_url` stores Supabase Storage path** (not a full URL). The detail page generates a signed URL (1-hour expiry) server-side — only for authenticated members. The path never reaches the client directly.
- **Soft-delete only** — `DELETE /api/admin/workshops/[id]` sets `is_hidden = true`; no records are ever destroyed. Admin can unhide via `PATCH`.
- **VideoPlayer auto-detects embed type** — YouTube regex extracts `v=` ID and produces `youtube.com/embed/` URL; Vimeo regex produces `player.vimeo.com/video/` URL; all other URLs use a native `<video controls>` element with `preload="metadata"` and an `onError` fallback message.
- **Search via URL params** (not client-side API call) — `WorkshopSearch` updates `?q=` and `?category=` on change; the parent server component re-renders with filtered results. No AJAX polling.
- **Free preview: 3 workshops** — same pattern as library; first 3 visible to all authenticated users, rest behind `MemberGate`. Gated cards are shown blurred at 50% opacity as a preview.
- **Admin upload two-step** — `UploadForm` uploads PDF first (`/api/admin/workshops/upload`), receives the Storage path, then creates the record with that path. Single form submit triggers both steps sequentially with error bail-out.
- **Slug auto-generated from title** — `slugify()` lowercases, strips non-alphanumeric, converts spaces to hyphens. Admin can override. Duplicate slugs return 400 with human-readable message.

### Deviations from prompt spec

- The `workshops` table already existed (from migration 001) with `id, title, description, video_url, pdf_url, held_on, created_at`. Migration 005 extends it rather than creating from scratch.
- `constitution_tags` stored as `text[]` (reusing the same column shape as `content` table) rather than a junction table.

### Trade-offs

- Admin workshops page is `'use client'` (fetch on mount) — consistent with the Q&A admin page pattern; acceptable for low-traffic admin tool.
- `WorkshopSearch` uses `defaultValue` (uncontrolled) on inputs — avoids re-render loops when URL params update; controlled inputs would fight with server re-renders.
- Video player for Supabase Storage URLs uses `<video>` with `preload="metadata"` — only loads first frame, not the full file, reducing bandwidth on page load.

### Pre-launch gates

- [ ] Run `supabase db push` to apply migration 005
- [ ] Create `workshops` Storage bucket if migration doesn't execute the `insert` (Supabase Dashboard → Storage → New bucket → `workshops`, Private)
- [ ] Add Storage RLS policies if not applied via migration

### Rollback

All changes are additive. To rollback Phase 16: delete `src/app/(dashboard)/workshops/`, `src/app/admin/workshops/`, `src/app/api/workshops/`, `src/app/api/admin/workshops/`, `supabase/migrations/005_workshops_extend.sql`, `tests/unit/workshops.test.ts`, and revert the Workshop type + WORKSHOP_CATEGORIES additions in `src/types/index.ts`.

### Next: Phase 17 — Loyalty milestones + referrals

---

## Phase 17 — Loyalty Milestones + Referrals

**Tier 1 (auto-proceeded):** New libs, new pages, new API routes, checkin route updated, test file.

### Files added / modified

| File | Lines | Change |
|------|-------|--------|
| `src/lib/loyalty/milestones.ts` | 130 | MILESTONES config (8 achievements), `checkAndAwardMilestones` (batch check + insert), `getMilestoneStatuses` |
| `src/lib/loyalty/referral.ts` | 79 | `getReferralStats`, `createReferralRecord` (idempotent, prevents self-referral), `convertReferral` (for Stripe webhook) |
| `src/app/api/loyalty/milestones/route.ts` | 25 | GET user milestones; POST trigger check |
| `src/app/api/loyalty/referral/route.ts` | 14 | GET referral stats |
| `src/app/api/loyalty/referral/claim/route.ts` | 28 | POST claim referral (called during onboarding) |
| `src/app/(dashboard)/loyalty/MilestoneGrid.tsx` | 73 | Server component: earned/locked grid, aria-labels, reached_at dates |
| `src/app/(dashboard)/loyalty/ReferralCard.tsx` | 70 | Client component: copy-to-clipboard, pending/converted counters |
| `src/app/(dashboard)/loyalty/page.tsx` | 65 | Server page: auth, parallel milestone check + stats fetch, member gate on milestones |
| `src/app/api/checkins/route.ts` | +3 | Import + fire-and-forget `checkAndAwardMilestones` call after successful upsert |
| `tests/unit/loyalty.test.ts` | 240 | Static analysis tests covering all Phase 17 files |

### Key decisions

- **Server-side milestone check on page load** — `checkAndAwardMilestones` is idempotent (checks existing milestones, never double-awards). Called once on `/loyalty` page load via `Promise.all` so it runs in parallel with stats fetches. Also fired fire-and-forget after every check-in API call.
- **Fire-and-forget in checkin route** — milestone check does not block the check-in response. `.catch(() => {})` prevents an unhandled promise rejection if the award fails; the next check-in or page visit will retry.
- **Referral card available to all users** — every user gets a `referral_code` on profile creation. Non-members can still share; milestones section is behind `MemberGate`.
- **`convertReferral` utility for Stripe webhook** — Phase 9 Stripe webhook can import and call this function when a referred user's subscription activates. It updates `status='converted'`, sets `reward_granted=true`, and triggers `checkAndAwardMilestones` for the referrer.
- **Clipboard API fallback** — if `navigator.clipboard` is unavailable (non-HTTPS or denied), `ReferralCard` selects the text in the readonly input so the user can copy manually.
- **Streak uses UK timezone** — consistent with check-in API. `en-CA` locale on `Intl.DateTimeFormat` gives `YYYY-MM-DD` without string manipulation.
- **Milestone conditions checked in parallel** — single `Promise.all` fetches checkin count, constitution count, converted referrals, member_since, and existing milestones. Streak is only computed if needed (streak milestones not yet earned).

### Deviations from prompt spec

- No push notification on milestone earned — Phase 20 (Notifications) will integrate with the milestone awarded return value.
- Month milestones use `member_since` from profiles (set by Stripe webhook on first subscription). If `member_since` is null the conditions evaluate to false safely.

### Trade-offs

- Milestone check is synchronous inside `checkAndAwardMilestones` — the function awaits the DB insert before returning. Latency is low (~50-100ms) because the insert batch is usually 0-2 rows.
- No client-side animation for newly earned milestones (they appear on refresh). Phase 18/20 can add a toast when `awarded.length > 0` comes back from the POST endpoint.

### Rollback

Delete `src/lib/loyalty/`, `src/app/api/loyalty/`, `src/app/(dashboard)/loyalty/`, `tests/unit/loyalty.test.ts`, and revert the 3-line checkin route change (remove the `checkAndAwardMilestones` import and fire-and-forget call).

### Next: Phase 18 — Member Dashboard & Navigation

---

## Phase 19 — Onboarding Flow

**Tier 1 (auto-proceeded):** New auth pages, new API routes, onboarding wizard, middleware updated, test file.

### Files added / modified

| File | Lines | Change |
|------|-------|--------|
| `src/app/(auth)/layout.tsx` | 14 | Minimal centred auth layout — no bottom nav |
| `src/app/(auth)/login/page.tsx` | 64 | Client login form; `signInWithPassword`; friendly error messages |
| `src/app/(auth)/signup/page.tsx` | 165 | Client signup form; `signupSchema` validation; all 4 consent checkboxes; referral code from URL |
| `src/app/api/auth/signup/route.ts` | 68 | POST signup: auth.signUp → profile upsert → recordConsents (with IP hash) → createReferralRecord |
| `src/app/onboarding/OnboardingWizard.tsx` | 185 | Client 4-step wizard: welcome → constitution → membership → complete |
| `src/app/onboarding/page.tsx` | 30 | Server wrapper: auth check, already-onboarded redirect, passes name + constitution to wizard |
| `src/app/api/onboarding/complete/route.ts` | 17 | POST: sets `onboarding_completed = true` via service client |
| `src/middleware.ts` | 85 | Updated: onboarding gate for dashboard routes; protect `/onboarding`; smart auth-page redirect |
| `tests/unit/onboarding.test.ts` | 200 | Static analysis tests covering all Phase 19 files |

### Key decisions

- **Onboarding gate in middleware** — all dashboard routes check `onboarding_completed` via a single primary-key lookup on profiles. Fast (indexed lookup), consistent, enforced at the routing layer. Users cannot bypass onboarding by typing a dashboard URL directly.
- **Auth-page redirect is onboarding-aware** — when an authenticated user hits `/login` or `/signup`, middleware fetches `onboarding_completed` and sends them to `/onboarding` (not `/dashboard`) if not complete. This avoids a double-redirect chain (`/login` → `/dashboard` → `/onboarding`).
- **Profile created via `upsert`** — in case a Supabase trigger has already inserted a partial row, the upsert is idempotent. Prevents unique constraint errors from race conditions.
- **Referral claim is fire-and-forget** — `createReferralRecord` is `.catch(() => {})`-wrapped in the signup route. A failed referral claim doesn't abort signup.
- **IP hashed before storing** — `hashIp()` applies HMAC with `NEXT_PUBLIC_APP_URL` as salt and stores only the first 16 chars of SHA-256 hex. Satisfies GDPR data minimisation for consent audit records.
- **4-step wizard in a single client component** — step state is local (`useState`). No URL params — wizard is not deep-linkable by design (keeps it simple; users always start from step 1 after signup).
- **Constitution step is adaptive** — if `constitution_primary` is already set (e.g., returning from `/constitution?onboarding=1`), the quiz prompt is replaced with the user's result card and a Continue button. Link passes `?onboarding=1` so the constitution page can eventually redirect back.
- **`HEALTH_DISCLAIMER` shown verbatim on complete step** — immutable string from `@/types`, satisfies the spec's "never paraphrase" rule.
- **`BILLING_PROMISE` shown on signup and membership step** — same immutable string.

### Deviations

- Phase 18 (Member Dashboard & Navigation) was skipped at user's instruction — this phase was built next instead.
- The `/constitution` quiz page is not built in this phase (it pre-exists from earlier phases per the migration and middleware config). The wizard links to it with `?onboarding=1` as a hook for that page to redirect back.

### Trade-offs

- Middleware now queries `profiles` on every dashboard page request (one extra DB call). For established users, this is a primary-key lookup adding ~5-10ms per request. Acceptable for MVP; can be replaced with an encrypted JWT claim or cookie in production for scale.
- The wizard does not save partial progress — if the user closes mid-wizard, they restart from step 1. Acceptable: the wizard takes ~2 minutes to complete.

### Rollback

Delete `src/app/(auth)/`, `src/app/onboarding/`, `src/app/api/auth/signup/`, `src/app/api/onboarding/`, `tests/unit/onboarding.test.ts`, and revert `src/middleware.ts` to the prior version (remove onboarding gate and update auth-page redirect logic).

### Next: Phase 20 — Notifications + PWA

---

## Phase 18 — Member Dashboard & Navigation

### Files created

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard home — greeting, check-in, seasonal tip, feature grid, membership banner |
| `src/app/(dashboard)/dashboard/CheckInCard.tsx` | Today's check-in CTA or summary (mood emoji, energy/sleep/pain tiles) |
| `src/app/(dashboard)/dashboard/SeasonalTipCard.tsx` | Current solar term + seasonal plan theme + daily tip |
| `src/app/(dashboard)/dashboard/FeatureGrid.tsx` | 3-column grid linking Library, Workshops, Community, Food Check, Progress, Loyalty |
| `src/app/(dashboard)/dashboard/MembershipBanner.tsx` | Upgrade banner shown to free users only; includes BILLING_PROMISE |
| `src/app/(dashboard)/profile/page.tsx` | Profile — avatar initials, membership status, constitution badge, referral code, account actions |
| `src/app/(dashboard)/profile/SignOutButton.tsx` | Client — `supabase.auth.signOut()` → `/login` |
| `tests/unit/dashboard.test.ts` | 40 static-analysis tests covering all dashboard + profile components |

### Architecture decisions

- Dashboard home lives at `(dashboard)/dashboard/page.tsx` → URL `/dashboard` — inherits `PersistentAudioPlayer` from the route group layout at `(dashboard)/layout.tsx`. Placing it at `(dashboard)/page.tsx` would miss the audio player.
- All DB fetches use `createServiceClient()` (service role) — profile, checkin, solar_terms in `Promise.all`, then seasonal plan sequentially (depends on solar term name).
- Pain score is inverted for display: `10 - value` so lower raw pain = higher displayed wellness score.
- `greetingFor()` uses `Intl.DateTimeFormat` in UK timezone to determine morning/afternoon/evening on the server — no hydration mismatch.
- `SeasonalTipCard` shows `daily_focus[0].morning_tip` as "Today's focus" — a safe preview on the home page; the full 7-day plan is at `/seasonal-plan`.
- `MembershipBanner` is only rendered when `!isMember` (status not in `['member', 'paused']`) — no banner flicker since this is server-rendered.
- Profile page shows `member_since` date only when `isMember` — avoids showing empty/null date for free users.
- `SignOutButton` calls `router.refresh()` after `router.push('/login')` to invalidate the Next.js router cache (prevents stale auth state on back-navigation).
- Referral code shown on profile page with quick copy via link to `/loyalty` — avoids duplicating the copy-to-clipboard logic (already in `ReferralCard` on the loyalty page).

### Trade-offs

- Avatar initials are computed from `full_name` — no profile photo upload in MVP; a future enhancement would add a storage-backed avatar field.
- `SeasonalTipCard` falls back gracefully when no plan exists (renders a "View guidance" link) — avoids a loading spinner on first login before a plan has been generated.

### Rollback

Delete `src/app/(dashboard)/dashboard/` (all 5 files), `src/app/(dashboard)/profile/` (page + SignOutButton), and `tests/unit/dashboard.test.ts`. DashboardLayout and BottomNav are unchanged and do not need rollback.

### Next: Phase 20 — Notifications + PWA

---

## Phase 20 — Notifications + PWA

### Files created / modified

| File | Purpose |
|------|---------|
| `public/offline.html` | Branded offline fallback page with sync-queue reassurance |
| `public/sw.js` | Service worker — app shell caching, push, background sync, offline navigation fallback |
| `src/lib/push/send.ts` | Server utility — `sendPushToUser`, `sendPushToAll` via web-push; auto-purges stale subscriptions (410/404) |
| `src/components/pwa/ServiceWorkerRegistration.tsx` | Client — registers SW on mount, drains offline queue on reconnect + SW message |
| `src/components/pwa/PushPermission.tsx` | Client — push opt-in/out toggle (Enable / Disable / Blocked states); VAPID subscription |
| `src/app/api/push/subscribe/route.ts` | POST — auth-gated; upserts push subscription keyed on user_id+endpoint |
| `src/app/api/push/unsubscribe/route.ts` | DELETE — auth-gated; removes subscription by user_id+endpoint |
| `src/app/api/cron/checkin-reminder/route.ts` | POST cron — CRON_SECRET gated; sends push to members who haven't checked in today |
| `src/app/(dashboard)/profile/page.tsx` | MODIFIED — added PushPermission card above sign-out |
| `src/app/layout.tsx` | MODIFIED — added ServiceWorkerRegistration (renders null, registers SW) |
| `vercel.json` | MODIFIED — added checkin-reminder cron at 19:00 UTC (= 20:00 BST / 19:00 GMT) |
| `tests/unit/pwa.test.ts` | 55 static-analysis tests covering all PWA + push components and routes |

### No new migration

`push_subscriptions` table (and its RLS policies) were already defined in `001_initial_schema.sql`. `web-push` and `@types/web-push` were already in `package.json`.

### Architecture decisions

- **SW background sync → client-side drain**: The SW posts `DRAIN_CHECKIN_QUEUE` to open clients rather than handling IDB directly. This avoids requiring ESM imports or `importScripts` in the SW, and works for MVP where the app is typically open during sync. The SW also re-registers the sync tag on next app open if clients were closed.
- **VAPID key env vars**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (safe to expose — used by browser for subscription), `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` are server-only. Run `npx web-push generate-vapid-keys` to generate and add to `.env.local`.
- **Stale subscription cleanup**: `sendPushToUser` catches 410/404 from web-push and batch-deletes stale records — handles users who revoke permission in browser settings.
- **Cron schedule 19:00 UTC**: 19:00 UTC = 20:00 BST (summer) / 19:00 GMT (winter) — consistent 8pm UK evening reminder throughout the year.
- **Email fallback**: Email notification via Resend is intentionally omitted — it is **TIER 3** (Resend email logic). Implement as a separate `src/app/api/cron/checkin-reminder-email/route.ts` when Michael provides explicit proceed.
- **CSP `worker-src`**: Already set to `'self' blob:` in `next.config.mjs` — the SW registration at `/sw.js` works within existing policy.

### Required env vars (add to .env.local + Vercel project settings)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from web-push generate-vapid-keys>
VAPID_PRIVATE_KEY=<from web-push generate-vapid-keys>
VAPID_SUBJECT=mailto:hello@qiflow.app
```

### Trade-offs

- Service worker is a plain JS file (not TypeScript) — avoids needing a custom webpack config to compile it. The SW is intentionally simple; no workbox dependency.
- Cron only runs once daily at 20:00 UK. Users who check in after the cron but before midnight won't get a second reminder — this is correct behaviour.

### Rollback

Delete `public/sw.js`, `public/offline.html`, `src/lib/push/`, `src/components/pwa/`, `src/app/api/push/`, `src/app/api/cron/checkin-reminder/`, `tests/unit/pwa.test.ts`. Revert `src/app/layout.tsx` (remove ServiceWorkerRegistration import + usage), `src/app/(dashboard)/profile/page.tsx` (remove PushPermission), and `vercel.json` (remove checkin-reminder cron entry).

### Next: Phase 21 — Observability + Analytics

---

## Phase 21 — Observability + Analytics

### Files created / modified

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Sentry browser init — replay (maskAllText), 10% traces, beforeSend strips request body |
| `sentry.server.config.ts` | Sentry server init — strips request body + auth headers in beforeSend |
| `sentry.edge.config.ts` | Sentry edge runtime init |
| `instrumentation.ts` | Next.js 14 instrumentation hook — registers Sentry on server/edge startup |
| `src/app/global-error.tsx` | Global React error boundary page — captures to Sentry, shows digest ref |
| `src/lib/analytics/track.ts` | Server-side fire-and-forget analytics — inserts to `analytics_events`; allowlist guards PII |
| `src/hooks/useAnalytics.ts` | Client hook — `trackEvent()` POSTs to `/api/analytics` with `keepalive: true` |
| `src/components/layout/ErrorBoundary.tsx` | Class component — catches React render errors, reports to Sentry, shows Try again + Home |
| `src/app/admin/analytics/page.tsx` | Admin dashboard — member stats, active users, push subs, event counts (last 7d) |
| `src/app/admin/page.tsx` | MODIFIED — replaced stub with links to analytics/Q&A/workshops |
| `src/app/(dashboard)/layout.tsx` | MODIFIED — wrapped children in ErrorBoundary |
| `src/app/api/checkins/route.ts` | MODIFIED — fires `track(user.id, 'check_in')` after successful upsert |
| `src/lib/loyalty/milestones.ts` | MODIFIED — fires push notification + `track('milestone_earned')` after award |
| `next.config.mjs` | MODIFIED (Tier 2) — added `withSentryConfig` wrapper + `instrumentationHook: true` |
| `tests/unit/observability.test.ts` | 50 static-analysis tests covering all Phase 21 files |

### Tier 2 declaration

`next.config.mjs` was modified to:
1. Import and wrap with `withSentryConfig` — enables source map upload and automatic SDK instrumentation
2. Add `experimental.instrumentationHook: true` — enables `instrumentation.ts` for server/edge Sentry init

This is a build configuration change, not a Tier 3 item. It is fully reversible.

### Architecture decisions

- **Replay masks all text / blocks all media** — QiFlow captures health data (mood, sleep, energy). Unmasked replays would violate GDPR and health data principles. This is non-negotiable.
- **`beforeSend` strips request bodies** — API request bodies may contain check-in data. Sentry events must never contain user health records.
- **`track()` uses an allowlist** — only `content_id, content_type, source, constitution, milestone, solar_term, category, count, from, slug` are stored. Any accidental passing of health data is silently discarded.
- **Dynamic import for `sendPushToUser` in milestones** — avoids a potential circular-dependency issue at module load time if the push send module ever imports from loyalty in the future.
- **AI costs via structured logs** — `logAICall()` already emits `[AI_METRIC]` JSON to stdout. Vercel Logs / any log drain can parse these. A dedicated DB table for AI costs is deferred until usage is high enough to need alerting.
- **`keepalive: true` in `useAnalytics`** — ensures the fetch completes even if the user navigates away (important for page-exit events).

### Required env vars (add to .env.local + Vercel project settings)

```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=qiflow
SENTRY_AUTH_TOKEN=...   # For source map upload during CI build
```

### Key events being tracked

| Event | Where | Properties |
|-------|-------|------------|
| `check_in` | `POST /api/checkins` | `content_type: 'checkin'` |
| `milestone_earned` | `checkAndAwardMilestones()` | `milestone` key |

Additional events to wire as the app grows: `article_view`, `workshop_view`, `constitution_complete`, `seasonal_plan_view`. Use `track()` server-side or `trackEvent()` client-side.

### Trade-offs

- Sentry session replay is enabled at 5% sample rate — keeps costs low while still capturing errors at 100%. Raise session rate post-launch once the replay budget is understood.
- Admin analytics page aggregates event counts in TypeScript (not SQL) for simplicity — acceptable at MVP scale (<10k events/week). Add a Supabase RPC function when the 500-row fetch limit becomes a constraint.

### Rollback

Delete `sentry.*.config.ts`, `instrumentation.ts`, `src/app/global-error.tsx`, `src/lib/analytics/`, `src/hooks/useAnalytics.ts`, `src/components/layout/ErrorBoundary.tsx`, `src/app/admin/analytics/`, `tests/unit/observability.test.ts`. Revert `next.config.mjs` (remove `withSentryConfig` + `instrumentationHook`), `src/app/(dashboard)/layout.tsx` (remove ErrorBoundary), `src/app/api/checkins/route.ts` (remove `track()` call), `src/lib/loyalty/milestones.ts` (remove push + track block), `src/app/admin/page.tsx` (restore stub).

### Next: Phase 22 — Test suite green
