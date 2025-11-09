# Unified Box

Small, production-lean **unified inbox** for SMS + WhatsApp with scheduling, notes, realtime, analytics, role-based access, and a clear trial-mode UX — built on **Next.js 16**, **Prisma/Postgres**, **Twilio**, **Pusher**, **Better Auth**, **Zod**, and **React Query**. 

* **Goal:** Centralize outreach and replies across SMS + WhatsApp with history, notes, and live collaboration in one place.
* **Timeframe:** 10–15 hours (completed)
* **Live demo script:** see the “Demo walkthrough” section below.

---

## Table of contents

* [Architecture overview](#architecture-overview)

* [Core features](#core-features)

* [Repository structure](#repository-structure)

* [Database schema (ERD)](#database-schema-erd)

* [Prerequisites](#prerequisites)

* [Configuration](#configuration)

  * [.env example](#env-example)

* [Local development](#local-development)

  * [Database & Prisma](#database--prisma)
  * [Ngrok & Twilio webhooks](#ngrok--twilio-webhooks)
  * [Pusher realtime](#pusher-realtime)

* [How to use](#how-to-use)

* [HTTP API](#http-api)

* [Analytics & export](#analytics--export)

* [Security, quality & observability](#security-quality--observability)

* [Integration comparison](#integration-comparison)

* [Known limitations](#known-limitations)

* [Next steps](#next-steps)

* [Demo walkthrough (3–5 min)](#demo-walkthrough-35-min)

* [References](#references)

---

## Architecture overview

* **Frontend:** Next.js 16 (App Router, TypeScript), React 18, Tailwind CSS v4, `next-themes`
* **Server:** Next.js API routes (Node runtime)
* **Database:** PostgreSQL via Prisma ORM
* **Auth:** Better Auth (email/password + Google), role claims (`admin`, `agent`)
* **Realtime:** Pusher (public key subscribe for this slice)
* **Messaging:** Twilio (SMS + WhatsApp Sandbox)
* **Validation:** Zod
* **Data fetching/state:** React Query (optimistic updates)
* **Multi-tenancy:** `Team` model with **tenant scoping** via `teamId` on `User`, `Contact`, `Thread`, `Message`, `Note`, `EventLog`; **guards** return `{ userId, role, teamId }` and all loaders/queries are **filtered by `teamId`**.

Design highlights:

* Normalized message model across channels; threads by contact
* Clear roles and protected routes (middleware + guards)
* Webhook-first ingestion with signature validation
* Simple “send later” scheduler with a cron-safe GET endpoint
* Minimal, scalable components and lib modules
* **Tenant isolation by `teamId`** and composite uniques on Contact/Thread for data integrity

---

## Core features

### Authentication & roles

* Sign In / Sign Up (credentials) + Google OAuth.
* Role claims: `admin`, `agent`. `/settings` is **admin-only**.
* Middleware enforces auth; unauthorized users are redirected to `/auth/sign-in`.
* Sessions persisted in DB.
* **Team assignment:** Users belong to a **Team**; `teamId` is captured on sign-up (client passes it) or defaulted server-side via Better Auth hooks; all protected pages use a guard that returns `{ userId, role, teamId }` for **tenant-scoped access**.

### Unified inbox (3-pane)

* Route: `/inbox`
* Left: **ThreadList** with filters (Unread / Scheduled / Channel) + search.
* Middle: **ThreadView** with compact bubbles, direction alignment, lazy media preview for WA images.
* Right: **ContactPanel**: contact info + notes timeline (public/private).
* **Tenant scope:** `getThreads`, `getThread`, and sidebar loaders **filter by `teamId`**.
* **Next 15/16:** `searchParams` are **async** in Server Components; the page awaits them to avoid build/runtime errors.

### Send & schedule (SMS / WhatsApp)

* `POST /api/send` validates input with Zod and:

  * Sends immediately via Twilio (status `sent`) or
  * Persists `status='scheduled'` when `scheduleAt` is provided (no Twilio call yet).
* **Tenant scope:** API **stamps `teamId`** on messages; if `threadId` isn’t provided, the route **upserts** a thread by **composite unique** `(teamId, contactId, channel)`.
* **Trial guard**: server enforces `VERIFIED_NUMBERS` (Twilio trial); UI explains trial limits.
* Composer supports channel switch (SMS/WA), body input, media URL for WA, **Send** & **Send later**; client simply resets `scheduleAt` after success.

### Inbound webhook (Twilio)

* `POST /api/webhooks/twilio`
* Validates Twilio signature; upserts **Contact** with **composite unique** `(teamId, phone)`, ensures **Thread** `(teamId, contactId, channel)`, inserts inbound **Message**, bumps `lastMessageAt` and `unreadCount`.
* WA media URLs saved to `Message.media` JSON.
* Returns 200 quickly.
* **Tenant scope:** inbound rows are created with the correct `teamId`.

### Scheduling runner

* DB keeps `Message.scheduledAt` and `status='scheduled'`.
* `GET /api/schedule/run`:

  * Finds due messages,
  * Sends via Twilio,
  * Updates `status='sent'`, `sentAt=now()`,
  * Emits `message.created` to subscribers.
* Operates safely with `teamId` stamped on all messages.

### Realtime (Pusher)

* Channel: `thread-{threadId}`
* Events: `message.created`, `note.created`
* Hook merges events into React Query cache for live updates in ThreadView/ContactPanel.

### Analytics + export

* `/dashboard` tiles:

  * **Messages by channel (7d)**
  * **Avg first response time (24h)**
* **Export CSV** for the above.

### Settings / Trial UX

* `/settings` (admin): displays Twilio trial number and verified-contacts requirement; link to buy a number.

---

## Repository structure

```
root
├─ README.md
├─ eslint.config.mjs
├─ tsconfig.json
├─ prisma.config.ts
├─ next.config.mjs
├─ postcss.config.mjs
├─ package.json
├─ package-lock.json
├─ public/
│  ├─ light.svg
│  └─ night.svg
└─ src/
   ├─ app/
   │  ├─ favicon.ico
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  ├─ auth/sign-in/page.tsx
   │  ├─ inbox/page.tsx
   │  ├─ dashboard/page.tsx
   │  ├─ settings/page.tsx
   │  ├─ hooks/useThreadRealtime.ts
   │  ├─ api/send/route.ts
   │  ├─ api/notes/route.ts
   │  ├─ api/schedule/run/route.ts
   │  ├─ api/webhooks/twilio/route.ts
   │  ├─ api/threads/[threadId]/route.ts
   │  ├─ api/threads/[threadId]/sidebar/route.ts
   │  ├─ api/auth/[...all]/route.ts
   │  ├─ api/analytics/export.csv/route.ts
   │  └─ api/analytics/summary/route.ts
   ├─ components/
   │  ├─ ThreadList.tsx
   │  ├─ ThreadView.tsx
   │  ├─ ContactPanel.tsx
   │  ├─ Composer.tsx
   │  ├─ Header.tsx
   │  ├─ theme/ThemeProvider.tsx
   │  └─ theme/ThemeToggle.tsx
   ├─ lib/
   │  ├─ db.ts
   │  ├─ auth.ts
   │  ├─ auth-client.ts
   │  ├─ auth/guards.ts
   │  ├─ validators/message.ts
   │  ├─ validators/note.ts
   │  ├─ validators/webhook.ts
   │  ├─ integrations/twilio.ts
   │  ├─ realtime/pusher.ts
   │  ├─ analytics/logger.ts
   │  ├─ analytics/queries.ts
   │  ├─ query.tsx
   │  └─ trial.ts
   ├─ middleware.ts
   └─ prisma/
      ├─ schema.prisma
      ├─ seed.ts
      └─ migrations/
```

---

## Database schema (ERD)

```mermaid
erDiagram
  Team ||--o{ User : has
  Team ||--o{ Contact : has
  Team ||--o{ Thread : has
  Team ||--o{ Message : has
  Team ||--o{ Note : has
  Team ||--o{ EventLog : has

  User ||--o{ Thread : owns
  User ||--o{ Message : "author (optional)"
  User ||--o{ Note : writes

  Contact ||--o{ Thread : has
  Thread ||--o{ Message : contains
  Thread ||--o{ Note : contains

  Team {
    String id PK
    String name
    DateTime createdAt
  }

  User {
    String id PK
    String email "unique"
    String name
    String image
    String role "admin|agent"
    String teamId FK
    DateTime emailVerified
    DateTime createdAt
    DateTime updatedAt
    "Index: teamId"
  }

  Contact {
    String id PK
    String teamId FK
    String name
    String phone
    Boolean waOptIn
    DateTime createdAt
    DateTime updatedAt
    "Unique: (teamId, phone)"
    "Index: teamId"
  }

  Thread {
    String id PK
    String teamId FK
    String contactId FK
    String ownerId "optional"
    String channel "sms|whatsapp"
    DateTime lastMessageAt
    Int unreadCount
    DateTime createdAt
    DateTime updatedAt
    "Unique: (teamId, contactId, channel)"
    "Indexes: (teamId, lastMessageAt), (teamId, channel)"
  }

  Message {
    String id PK
    String teamId FK
    String threadId FK
    String authorId "optional"
    String channel
    String direction "inbound|outbound"
    String body
    Json media "optional"
    String status "draft|scheduled|sent|delivered|failed|read"
    String providerId "optional"
    DateTime scheduledAt "optional"
    DateTime sentAt "optional"
    DateTime deliveredAt "optional"
    DateTime readAt "optional"
    DateTime createdAt
    "Indexes: (teamId, status, scheduledAt), (threadId, createdAt)"
  }

  Note {
    String id PK
    String teamId FK
    String threadId FK
    String authorId FK
    String visibility "public|private"
    String body
    DateTime createdAt
    "Indexes: (teamId, threadId), (threadId, createdAt)"
  }

  EventLog {
    String id PK
    String teamId FK
    String type
    Json payload
    DateTime createdAt
    "Index: (teamId, type, createdAt)"
  }
```

---

## Prerequisites

* **Node.js** 20 LTS

* **npm** 10+ (or pnpm/yarn if preferred)

* **PostgreSQL** 14+ (local or cloud; Docker ok)

* **Twilio** account with:

  * One SMS number (trial is fine)
  * **WhatsApp Sandbox** enabled for testing

* **Ngrok** (for public webhook URL in dev)

* **Pusher** account (free tier is fine)

* **Google OAuth** (for optional sign-in)

---

## Configuration

Create `.env` at project root (see example below). Copy `.env.example` and fill secrets.

### .env example

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/unified_box

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=+1XXXXXXXXXX
TWILIO_WA_FROM=whatsapp:+14155238886  # or your WA-enabled number

# Twilio trial guard: only these E.164 numbers are allowed for outbound
VERIFIED_NUMBERS=+91XXXXXXXXXX,+1YYYYYYYYYY

# Realtime (Pusher)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Public base URL used for webhooks (ngrok URL in dev)
PUBLIC_BASE_URL=https://<your-ngrok-subdomain>.ngrok.app

# Auth (Google OAuth is optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Tenancy defaults (used by signup/hook and seed)
DEFAULT_TEAM_ID=default-team
DEFAULT_TEAM_NAME="Default Team"
NEXT_PUBLIC_DEFAULT_TEAM_ID=default-team
```

Notes:

* **VERIFIED_NUMBERS**: For Twilio trial, add the E.164 caller IDs you verified in Twilio Console (SMS) and the phone(s) that joined the **WhatsApp Sandbox**. This is enforced server-side.
* **PUBLIC_BASE_URL** must be HTTPS and reachable by Twilio (ngrok recommended in dev).
* **DEFAULT_TEAM_ID** is used to seed/ensure a default Team and to backfill `teamId` when a client doesn’t pass it during sign-up.

---

## Local development

### Database & Prisma

```bash
# 1) Install deps
npm i

# 2) Start Postgres (example via Docker)
docker run --name unified_box_pg -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user \
  -e POSTGRES_DB=unified_box -p 5432:5432 -d postgres:14

# 3) Migrate & seed
npx prisma migrate dev -n init
tsx prisma/seed.ts

# After introducing tenancy (Team + teamId):
# If you’re upgrading an existing DB, reset & re-seed:
npx prisma migrate reset
tsx prisma/seed.ts

# 4) Dev server
npm run dev
```

Helpful scripts:

* `npx prisma migrate reset` – reset DB and re-seed
* `npm run lint` / `npm run format`

### Ngrok & Twilio webhooks

1. Start ngrok (replace 3000 if your dev port differs):

   ```bash
   ngrok http https://localhost:3000
   ```

2. Copy the ngrok URL into `.env` as `PUBLIC_BASE_URL`.

3. **Configure Twilio webhooks**:

   * **SMS**: Set **Messaging webhook** to
     `POST ${PUBLIC_BASE_URL}/api/webhooks/twilio`
   * **WhatsApp Sandbox**: In Twilio Console under *Messaging → Try it out → WhatsApp Sandbox*, set **When a message comes in** to the same URL and join the sandbox from your phone per Twilio’s instructions.

4. Send yourself an SMS/WA and reply from your phone — inbound messages should hit the webhook and appear in the thread.

> In India, carrier policies can block trial inbound SMS; **WhatsApp Sandbox** is the reliable path for end-to-end demo during development.

### Pusher realtime

* Ensure `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*` match and the `PUSHER_CLUSTER` is correct.
* The app subscribes to `thread-{threadId}` channels and listens for `message.created` / `note.created`.

---

## How to use

1. **Sign in**

   * Visit `/auth/sign-in`. Use credentials or Google OAuth.
   * Role enforcement:

     * `/settings` → **admin only**
     * `/inbox`, `/dashboard` → **agent/admin**
   * **Tenant:** users are attached to a Team; all subsequent requests/pages are **team-scoped** via guards.

2. **Inbox**

   * `/inbox` loads with a selected thread (or the first available) to avoid 404s in side panels.
   * Uses **async `searchParams`** to comply with Next 15/16 Server Components.
   * Use filters (**Unread**, **Scheduled**, **Channel**) and search.

3. **Send / Send later**

   * Use the **Composer** to choose **SMS** or **WhatsApp**.
   * Add a media URL for WhatsApp images.
   * Click **Send** for immediate delivery (subject to trial guard) or **Send later** and pick a time.

4. **Run the scheduler in dev**

   * Manually trigger due sends:

     ```bash
     curl -sS "${PUBLIC_BASE_URL}/api/schedule/run"
     ```

5. **Notes**

   * Add **public** or **private** notes in the right panel; appears optimistically and then via realtime events.

6. **Realtime**

   * Open the same thread in two tabs; sends and notes append live.

7. **Analytics**

   * `/dashboard` shows tiles; click **Export CSV** to download the data behind them.

8. **Settings**

   * `/settings` (admin) shows your trial number and the verified-contacts requirement.

---

## HTTP API

| Method | Path                              | Description                                                                         |
| -----: | --------------------------------- | ----------------------------------------------------------------------------------- |
|   POST | `/api/send`                       | Validate + send or schedule SMS/WA (**tenant-stamped**, thread upsert by composite) |
|    GET | `/api/schedule/run`               | Process due scheduled messages; update status/sentAt; emit realtime                 |
|   POST | `/api/webhooks/twilio`            | Inbound SMS/WA webhook (signature verified); **tenant-scoped** upserts              |
|   POST | `/api/notes`                      | Create note (threadId, body, visibility)                                            |
|    GET | `/api/threads/[threadId]`         | Fetch thread + messages (ordered asc), **team-scoped**                              |
|    GET | `/api/threads/[threadId]/sidebar` | Fetch contact + notes for right panel, **team-scoped**                              |
|    GET | `/api/analytics/export`           | CSV export for dashboard tiles                                                      |
|    ALL | `/api/auth/[...all]`              | Better Auth routes                                                                  |

---

## Analytics & export

* **Messages by channel (7d)** — grouped counts for SMS vs WA.
* **Avg first response time (24h)** — computed with SQL (CTEs/windowing).
* **Export**: `GET /api/analytics/export` produces a CSV of the tile data.

---

## Security, quality & observability

* **AuthN/Z:** Better Auth with role claims; middleware route protection; `/settings` is admin-only.
* **Tenancy:** All DB reads/writes **filter by `teamId`** obtained from guards; Contact/Thread use **composite uniques** to prevent cross-tenant collisions.
* **Validation:** All external input is Zod-validated before processing.
* **Webhook security:** Twilio signature validation occurs before DB mutations.
* **Indexes:** Critical fields indexed (`Thread.lastMessageAt`, `Message.status/scheduledAt`, etc.) with `teamId` prefixes where appropriate.
* **Lint/format:** ESLint + Prettier. CI-friendly.
* **Event logging:** Optional `EventLog` records key events per team for debugging/auditing.

---

## Integration comparison

> Indicative, high-level characteristics. Costs vary by region/account and can change; consult provider pricing pages when deploying.

| Channel / Service     | Latency (typical)           | Cost (indicative)                                      | Reliability notes                                 | Notes                                                                      |
| --------------------- | --------------------------- | ------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------- |
| **SMS (Twilio)**      | Seconds (carrier dependent) | Per-message billing; country-specific                  | Dependent on carrier routes and sender compliance | In trial, only verified caller IDs; India inbound trial may be restricted. |
| **WhatsApp (Twilio)** | Sub-second to seconds       | Per-message/session-based by template type/region      | Highly reliable via Meta WA Business API          | Use **Sandbox** in dev; join code required on tester device.               |
| **Pusher (Realtime)** | Sub-200ms publish→subscribe | Free tier available; paid scales by connections/events | Managed websockets with global edges              | Use private/auth channels in production.                                   |

Key decisions:

* Normalize messages across channels in a single `Message` table for consistent querying.
* Keep scheduling simple (DB + GET runner) to be cron-friendly on any platform.
* Use optimistic UI + realtime to keep threads consistent across tabs/sessions.
* **Enforce tenant isolation by `teamId` end-to-end.**

---

## Known limitations

* Local dev scheduler requires a manual `GET /api/schedule/run` or an external cron.
* Trial-mode SMS inbound is restricted in some regions (notably India); WhatsApp Sandbox is recommended for the full demo loop.
* Media is URL-based (no local uploads in this slice).
* Pusher uses public subscribe for this slice; production should secure channels with an auth endpoint.

---

## Next steps

* File uploads to object storage (S3) with signed URLs.
* Secure realtime with private channels + auth endpoint; presence & typing indicators.
* Mentions/cursors/collab via Yjs.
* Deeper analytics (per-agent SLA, delivery rates, WA template performance).
* **Org/team management UI** (invite users, assign roles).
* E2E tests (Playwright) and unit tests.
* Deployment and cron automation (e.g., Vercel cron, GitHub Actions).

---

## Demo walkthrough (3–5 min)

1. Sign in as **admin**.
2. Open **/inbox** and select a thread.
3. Send a **WhatsApp** message (optionally add an image URL).
4. Reply from your phone (WA Sandbox) → see live update in the thread.
5. Add a **public** and a **private** note → both appear; the public one is visible to all.
6. Schedule a message for **+1 min** → hit `/api/schedule/run` → message is delivered.
7. Visit **/dashboard** and **Export CSV**.
8. Open **/settings** to show the trial constraints and verified contacts tip.

---

## References

* Assignment brief and requirements.

---

### Appendix: Dev scripts

```bash
# Migrate with a name
npx prisma migrate dev -n <name>

# Reset DB (use when switching to team-based schema)
npx prisma migrate reset

# Seed data (creates default team and sample data)
tsx prisma/seed.ts

# Lint & format
npm run lint
npm run format

# Dev server
npm run dev
```

---

**License:** Internal assignment prototype. Use at your own discretion for further development.
