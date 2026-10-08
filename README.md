# ONE SHOT FMGE — Clinical Preparation & Mastery Platform

> **Your FMGE. One focused plan.** High-yield 19 medical subjects, adaptive priority engine, closed-loop error remediation, 10-MCQ practice drills, crash slides, and spaced revision retention.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+ (or LTS)
- npm 10+

### Steps
1. **Clone and install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` in `.env`.
3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🛠️ Verification & Building

Run the complete automated validation suite before deploying:

```bash
# Typecheck + run 30 test suites (173 unit tests) + production bundle
npm run validate
```

Or run steps individually:
```bash
npm run lint         # TypeScript check (tsc --noEmit)
npm test             # Unit & Integration test suite
npm run build        # Builds client SPA, server bundle & worker bundle
npm start            # Starts the production web server
npm run start:worker # Starts the Telegram background worker
```

---

## 🌐 Deployment Options

### Option 1: Render (Recommended Full-Stack)
This repository includes a blueprint specification in `render.yaml` configuring:
- `oneshot-fmge-web`: Web API & Frontend SPA
- `oneshot-fmge-telegram-worker`: Standalone MTProto background ingestion worker
- `oneshot-fmge-db`: Managed PostgreSQL database

**Persistence:** both Render services use the same `DATABASE_URL`. User profiles and study-state snapshots, both Telegram ingestion pipelines, runtime Gemini key configuration, and downloaded Telegram media are stored in PostgreSQL. Firebase remains the sign-in provider. Existing Firestore profile/state records are copied into PostgreSQL the first time each user signs in after this migration; Firestore is kept as a read-only fallback during that import. Signed-in browser caches and guest data remain local for offline use.

Telegram records retain the current API model in locked JSONB state documents during this compatibility migration. User/profile rows and media blobs use dedicated tables. The schema also retains the earlier normalized Telegram tables for the next record-level migration; the current compatibility adapter does not yet write to those tables. Mutations to Telegram JSONB state are serialized with PostgreSQL row locks, so the web service and worker share one durable state.

**Legacy data safety:** the JSON snapshots in Render's web and worker filesystems are not in Git and may differ. Before the first production rollout, export each service's current state and run the migration from an environment where those snapshots are available. Startup imports each source once using its `PERSISTENCE_MIGRATION_SOURCE` label and records counts in `persistence_migration_log`. If a source file is missing while its PostgreSQL namespace is empty, production startup stops; set `PERSISTENCE_ALLOW_EMPTY=true` only after verifying that source contains no records to preserve. Existing Firestore user data migrates per user on their next sign-in. Run `npm run migrate:postgres` in the same environment as the snapshot and `DATABASE_URL` to display migration counts.

**Deploying to Render:**
1. Push your repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Select this repository. Render will automatically detect `render.yaml` and configure all services.
4. Confirm the web and worker use the same `DATABASE_URL` and their distinct `PERSISTENCE_MIGRATION_SOURCE` values from `render.yaml`. Export/import legacy JSON before replacing the old service instances. Fill secret environment variables (`APP_OWNER_UID`, and optionally `TELEGRAM_API_ID` & `TELEGRAM_API_HASH`; add `TELEGRAM_WEBHOOK_SECRET` only if using the webhook). `GEMINI_API_KEY` may be supplied through Render or the owner-only settings screen.
5. Click **Apply**.

---

### Option 2: Docker / Container Platforms (VPS, Railway, Fly.io, Cloud Run)
A multi-stage `Dockerfile` is included.

**Build and run container locally:**
```bash
docker build -t oneshot-fmge .
docker run -p 3000:3000 -e GEMINI_API_KEY="your_key" oneshot-fmge
```

**Docker Compose / Railway / Fly.io:**
Point your service to the `Dockerfile`. The container runs `node dist/server.cjs` on `PORT 3000` with static assets and health check endpoint at `/api/health`.

---

### Option 3: Process Managers / PaaS (Heroku, Railway, Dokku)
A `Procfile` is pre-configured:
```text
web: npm run start
worker: npm run start:worker
```
Simply connect your git repository and set the environment variables in your provider's dashboard.

---

### Option 4: Vercel / Netlify (Frontend SPA)
If deploying the frontend independently on Vercel or Netlify:
- **Vercel**: Configuration is provided in `vercel.json` with SPA route rewrites.
- **Netlify**: Configuration is provided in `netlify.toml` with redirect rules.
- **Build Command**: `npm run build:client` (or `npm run build`)
- **Output Directory**: `dist`

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | Set to `production` in live environments. |
| `PORT` | Auto | Port for Express server (defaults to 3000 or platform `$PORT`). |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for dynamic MCQ generation and distractor analysis. |
| `DATABASE_URL` | Required in production | Shared Render PostgreSQL connection for the web service and Telegram worker. |
| `PERSISTENCE_MIGRATION_SOURCE` | Required on each Render service | Distinct label that makes each legacy JSON import idempotent. |
| `PERSISTENCE_ALLOW_EMPTY` | Migration exception only | Set to `true` only after verifying that a missing legacy snapshot had no data to migrate. |
| `SESSION_ENCRYPTION_KEY` | Required in production | 32-byte hex key for encrypting Telegram MTProto sessions at rest. |
| `TELEGRAM_API_ID` | Optional | Telegram application ID from [my.telegram.org](https://my.telegram.org/apps). |
| `TELEGRAM_API_HASH` | Optional | Telegram application hash from [my.telegram.org](https://my.telegram.org/apps). |
| `APP_OWNER_UID` | Required for Telegram and in-app Gemini key controls | Firebase Authentication UID allowed to access the shared server-side Telegram account and change the server Gemini key. Set this to the owner account's UID in Render. |
| `TELEGRAM_WEBHOOK_SECRET` | Required only when using the Telegram webhook | Secret token sent in Telegram's `X-Telegram-Bot-Api-Secret-Token` header. |
