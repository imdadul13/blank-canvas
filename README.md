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

### Licensed question-bank content
The Question Bank workspace reads `server/data/question-bank.json` on the web server and serves optimized figures from `public/qbank-images/`. Import licensed PDFs locally with `python scripts/import-question-bank.py /path/to/pdf-folder`; the folder should contain the five `*_unlocked.pdf` source files. The local Python environment needs `pypdf`, `pdfplumber` and Pillow. The importer validates four-option answer keys, records source/page metadata, deduplicates matching question variants without merging conflicting answer keys, and writes `question-bank-import-report.json`. It preserves valid questions even when the source PDF has no rationale, flags those records, and shows learners that the source explanation is missing. Do not add the original PDFs to the repository or client bundle. Include the generated JSON and image assets in the web-service deployment so the bank is available at runtime.

Chapterwise subject headings are used directly. For yearwise books without question-level subject labels, the importer classifies from question text and leaves uncertain cases under **Uncategorized** rather than presenting a low-confidence subject as fact.

Answer keys and source explanations are returned only after a learner submits an answer in an authenticated practice session. Incorrect answers can request a Gemini option-by-option tutor review; configure `GEMINI_API_KEY` for that AI layer. The source explanation remains available if Gemini is unavailable.

---

## 🌐 Deployment Options

### Option 1: Render (Recommended Full-Stack)
This repository includes a blueprint specification in `render.yaml` configuring:
- `oneshot-fmge-web`: Web API & Frontend SPA
- `oneshot-fmge-telegram-worker`: Standalone MTProto background ingestion worker
- `oneshot-fmge-db`: Managed PostgreSQL database

**Persistence:** the application currently uses Firebase for sign-in and local JSON files for server-side app and Telegram data. The web service and worker have separate filesystems, so their data is not shared and may be lost when an instance is replaced. PostgreSQL is provisioned by the Render blueprint but is not yet used by the app runtime. A shared PostgreSQL migration will be handled separately after safely exporting the existing service snapshots.

**Deploying to Render:**
1. Push your repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Select this repository. Render will automatically detect `render.yaml` and configure all services.
4. Set `APP_OWNER_UID` to the Firebase UID authorized to use the shared Telegram controls and configure the server Gemini key. Set `TELEGRAM_WEBHOOK_SECRET` if you use the webhook. Add `GEMINI_API_KEY` and, optionally, `TELEGRAM_API_ID` & `TELEGRAM_API_HASH`.
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
| `SESSION_ENCRYPTION_KEY` | Required in production | 32-byte hex key for encrypting Telegram MTProto sessions at rest. |
| `TELEGRAM_API_ID` | Optional | Telegram application ID from [my.telegram.org](https://my.telegram.org/apps). |
| `TELEGRAM_API_HASH` | Optional | Telegram application hash from [my.telegram.org](https://my.telegram.org/apps). |
| `APP_OWNER_UID` | Required for Telegram and in-app Gemini key controls | Firebase Authentication UID allowed to access the shared server-side Telegram account and change the server Gemini key. |
| `TELEGRAM_WEBHOOK_SECRET` | Required only when using the Telegram webhook | Secret token sent in Telegram's `X-Telegram-Bot-Api-Secret-Token` header. |
| `FIREBASE_PROJECT_ID` | Recommended | Firebase project ID used for server-side ID-token verification (defaults to `one-shot-fmge`). |
