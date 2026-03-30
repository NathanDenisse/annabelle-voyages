# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

## Project Overview

**Annabelle Voyages** is a bilingual (FR/EN) portfolio site and CMS for a travel content creator. It consists of:
- A one-page public vitrine (homepage) with real-time Firestore data
- A protected admin dashboard (`/admin/*`) for managing all site content

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npm run seed     # Populate Firestore with initial data (requires Firebase Admin SDK credentials)
```

No test suite is configured.

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · Firebase (Firestore + Auth + Storage) · Tailwind CSS · Framer Motion · Embla Carousel · dnd-kit

**Node:** 22.x (see `.node-version`)

**Key path alias:** `@/*` → `./src/*`

**Rendering:** The homepage (`page.tsx`) uses `export const dynamic = "force-dynamic"` and is fully client-side (`"use client"`). All data comes from Firestore real-time listeners, not SSR.

### Data Layer (Firebase, no ORM)

All Firestore operations go through `src/lib/firestore.ts`. Custom hooks in `src/hooks/useFirestore.ts` expose real-time `onSnapshot` listeners used throughout the app.

**Firestore collections:**
| Collection | Notes |
|---|---|
| `content/main` | Single document: all site text, stats, contact info |
| `socials/main` | Single document: social media links |
| `hero/main` | Single document: hero background media |
| `next_trip/main` | Single document: upcoming trip info |
| `portfolio` | Collection: ordered portfolio items |
| `partnerships` | Collection: ordered brand partnerships |
| `testimonials` | Collection: ordered testimonials |
| `messages` | Collection: contact form submissions |
| `storage_tracking` | Collection: file upload audit log |

**Media model:** All portfolio and partnership items use a unified `gallery: MediaItem[]` where `gallery[0]` is the cover. Legacy Firestore documents had separate `imageUrl`/`videoUrl`/`mp4VideoUrl` fields — the hooks in `useFirestore.ts` normalize these to `gallery[]` on read. The `/admin/migrate` page handles bulk migration.

**`MediaItem` type:**
```typescript
{ type: "image" | "video", url: string, platform?: "youtube" | "youtube-short" | "mp4" | "instagram" | "tiktok",
  thumbnailUrl?: string, format?: "vertical" | "horizontal" }
```

### Bilingual Content

All user-facing text uses `LocalizedText = { fr: string; en: string }`. The `t()` helper in `src/lib/i18n.ts` selects the correct string based on the active language. Language preference is stored in localStorage under `av_lang`.

### Admin Dashboard

Protected by Firebase Auth (email/password). All `/admin/*` routes check `useAuth()` and redirect to `/login` if unauthenticated.

Admin forms use `useAutosave()` (debounced writes) and `SmartBilingualField` (FR/EN inputs with optional Claude AI suggestions via `/api/suggest`).

### AI Integration

Two server-side API routes call the Anthropic SDK:
- `/api/translate` — FR ↔ EN translation
- `/api/suggest` — bilingual content suggestions for portfolio/partnership fields

Requires `ANTHROPIC_API_KEY` in environment (not in `.env.local.example` — must be added manually).

### Media Uploads

`MediaUploader` component → client-side compression via `browser-image-compression` → Firebase Storage upload → URL stored in Firestore. MP4 videos auto-generate a JPEG thumbnail on upload.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
ANTHROPIC_API_KEY          # For /api/translate and /api/suggest (not in example file)
FIREBASE_ADMIN_PROJECT_ID  # Only needed for seed script
```

## Firestore Security Rules

`firestore.rules` enforces:
- Public read: `content`, `portfolio`, `partnerships`, `testimonials`, `next_trip`, `socials`, `hero`
- Public create only: `messages` (contact form)
- Authenticated write: everything else (admin operations)

After editing rules, deploy with `firebase deploy --only firestore:rules,storage`.

## Design System

**Fonts:** `font-serif` = Cormorant Garamond (headings), `font-sans` = DM Sans (body), `font-script` = Great Vibes (decorative)

**Color palette (Tailwind):** `cream-*` (backgrounds), `blush-*` (soft accents), `brown-*` (text), `terracotta-*` (primary accent), `gold-*` (secondary accent), `sunset-*` (orange/pink gradients). CSS variables also defined in `globals.css` (`--cream`, `--blush`, `--brown`, `--terracotta`, `--gold`, `--sunset-orange`, `--sunset-pink`).
