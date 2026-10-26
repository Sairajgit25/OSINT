# FootprintX

**An open-source, privacy-first defensive OSINT tool.** Enter an email address or username, receive a structured digital-exposure report: breached credentials, registered accounts, public web references, an identity correlation graph, and an actionable risk score.

> [!IMPORTANT]
> **v0.1 runs entirely on a simulated data engine.** It makes **zero external network requests**. All findings are generated deterministically from the identifier you enter (same input → same report), using realistic catalogs modeled on XposedOrNot, Sherlock, Holehe, and WhatsMyName. This makes the app safe to demo, test, and develop against without touching anyone's real data.

---

## Features

- **Consent gate** — scans only run after an explicit, informed opt-in (PRD §4)
- **Two identifier types** — email or username, with validation
- **Two scan modes** — `quick` and `deep` (deep adds more correlation stages)
- **8-tab results dashboard**
  - Overview — key stats and charts
  - Accounts — platform matches with §26 confidence grading (confirmed / likely / possible / not found)
  - Breaches — historical breach exposure; **credentials are never displayed** (PRD §31)
  - Public Web — public mentions and references
  - Identity Graph — interactive React Flow graph linking correlated identifiers
  - Risk — itemized, weighted risk score with animated gauge (PRD §25)
  - Recommendations — interactive remediation checklist
  - Evidence — full source attribution for every finding (PRD §43)
- **Privacy mode** — `after_scan` retention scans are kept **in memory only**, never written to the database, and wiped when the scan completes (PRD §37)
- **REST API** — full programmatic access under `/api/v1/*` (PRD §41/§45)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui + tw-animate-css |
| Charts | Recharts |
| Identity graph | @xyflow/react (React Flow) |
| Database | SQLite via Prisma ORM |
| Validation | Zod (schemas) + custom identifier validators |
| Package manager | npm (`bun.lock` is also included for Bun users, but Bun is optional) |

---

## Running Locally

### Prerequisites

- **Node.js ≥ 20.9** (LTS 20 or 22 recommended) — check with `node -v`
- **npm ≥ 10** (ships with Node 20+)

### Step-by-step

**1. Open a terminal in the extracted project folder**

```bash
cd path/to/your-project-folder
```

**2. Install dependencies** (this can take a couple of minutes)

```bash
npm install
```

**3. Point Prisma at the SQLite database**

Open the `.env` file in the project root. It ships with an absolute path from the build machine — **you must change it**. Set it to:

```env
DATABASE_URL="file:../db/custom.db"
```

> Why `../db/`? Prisma resolves relative SQLite paths against `prisma/schema.prisma`, so `../db/custom.db` points to `db/custom.db` in the project root — the database file that ships with the project (it contains demo scan history; delete it any time for a fresh start).

If your `.env` file is missing entirely, just create it with that single line.

**4. Initialize the database schema** (idempotent — safe to run even if the DB already exists)

```bash
npm run db:push
```

**5. Start the dev server**

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You should see the FootprintX home screen with the scan form.

### Production build (optional)

```bash
npm run build
npm run start
```

`build` produces a self-contained standalone server under `.next/standalone` (a small Node helper, `scripts/copy-standalone.js`, copies the static assets in — Windows-safe, no `cp` needed). `start` serves it with plain Node; **Bun is not required anymore**.

For day-to-day testing and polishing, `npm run dev` is all you need — it hot-reloads on every save.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `PrismaClientInitializationError` / database not found | Your `.env` still points at the old absolute path — redo Step 3. As a fallback, use a full absolute path to `db/custom.db` on your machine, e.g. `DATABASE_URL="file:/Users/me/projects/footprintx/db/custom.db"` |
| `Error: P1003: table does not exist` | Run `npm run db:push` (Step 4) |
| Port 3000 already in use | `npx next dev -p 3001` and open http://localhost:3001 |
| `'tee' is not recognized` on Windows | Only happens with an **older copy** of this project whose npm scripts used Unix commands. Run `npx next dev -p 3000` to start instantly, then apply the one-time fix below |
| `npm run lint` fails on `require()` in `scripts/` | Older copy again — the current ESLint config ignores `scripts/**` (plain Node utilities, not app code) |
| Node version errors during `npm install` | Upgrade to Node 20+ (Tailwind 4 and Next 16 both require it) |
| Want a clean database | Stop the server, delete `db/custom.db`, run `npm run db:push` |

> **One-time fix for older copies (Windows)** — early downloads shipped Unix-only npm scripts (`tee`, `cp`, `NODE_ENV=...`), which break on `cmd.exe`. The current copy is Windows-safe out of the box. If yours is older, replace the `"scripts"` block in `package.json` with:
>
> ```json
> "scripts": {
>   "dev": "next dev -p 3000",
>   "build": "next build && node scripts/copy-standalone.js",
>   "start": "node .next/standalone/server.js",
>   "lint": "eslint .",
>   "db:push": "prisma db push --accept-data-loss",
>   "db:generate": "prisma generate",
>   "db:migrate": "prisma migrate dev",
>   "db:reset": "prisma migrate reset"
> }
> ```
>
> …and create `scripts/copy-standalone.js` ([get it here, 15 lines](scripts/copy-standalone.js)) — it replaces the Unix `cp -r` inside `build`. Everything else in the project is already cross-platform.

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build (standalone output + cross-platform asset copy) |
| `npm run start` | Serve the production build (plain Node) |
| `npm run lint` | ESLint across the project |
| `npm run db:push` | Sync `prisma/schema.prisma` to the SQLite file |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:reset` | Reset database + replay migrations |

## Project Structure

```
├── prisma/schema.prisma        # ScanRecord model (SQLite)
├── db/custom.db                # SQLite database file
├── src/
│   ├── app/
│   │   ├── page.tsx            # Single-page app entry
│   │   ├── layout.tsx          # Root layout, fonts, theme
│   │   └── api/v1/
│   │       ├── scans/route.ts              # POST create scan, GET recent
│   │       ├── scans/[id]/route.ts         # GET status, DELETE scan
│   │       ├── scans/[id]/results/route.ts # GET full report
│   │       └── scanners/route.ts           # GET scanner registry/health
│   ├── components/
│   │   ├── footprint/          # App shell, consent dialog, scan flow,
│   │   │   └── tabs/           #   and the 8 result tabs
│   │   └── ui/                 # shadcn/ui primitives
│   └── lib/
│       ├── db.ts               # Prisma client singleton
│       └── scanner/            # ⭐ The simulated intelligence engine
│           ├── types.ts        #   §16 unified finding schema
│           ├── hash.ts         #   FNV-1a, sha256, mulberry32 PRNG, masking
│           ├── catalog.ts      #   breach/platform/presence/mention catalogs
│           ├── engine.ts       #   deterministic report generation
│           ├── scoring.ts      #   §25 weighted risk model
│           ├── recommendations.ts  # remediation builder
│           ├── events.ts       #   §29 stage definitions + §42 event log
│           └── store.ts        #   scan lifecycle + persistence rules
```

## API Reference

Base URL: `http://localhost:3000`

### Create a scan

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"type":"email","value":"jane.doe@example.com","mode":"deep","retention":"d30"}'
```

Response: `{ "scan_id": "<uuid>", "status": "queued", "privacy_mode": false, "mode": "deep" }`

| Field | Values | Notes |
|---|---|---|
| `type` | `email` \| `username` | Required |
| `value` | the identifier | Validated (422 on bad input) |
| `mode` | `quick` \| `deep` | Defaults to `quick` |
| `retention` | `d30` \| `until_deleted` \| `after_scan` | `after_scan` auto-enables **privacy mode** (never persisted) |

### Poll status → fetch results → delete

```bash
# Status (queued → running → completed), includes stage progress
curl http://localhost:3000/api/v1/scans/<scan_id>

# Full report (only once status === "completed")
curl http://localhost:3000/api/v1/scans/<scan_id>/results

# Delete (honors until_deleted retention immediately)
curl -X DELETE http://localhost:3000/api/v1/scans/<scan_id>
```

### Scanner registry

```bash
curl http://localhost:3000/api/v1/scanners
```

Returns the simulated scanner versions and health (XposedOrNot, Sherlock, Holehe, WhatsMyName).

## How the Simulated Engine Works

The engine (`src/lib/scanner/`) is **deterministic**: the identifier is normalized, hashed with **FNV-1a**, and that hash seeds a **mulberry32** PRNG. Every "discovery" (which breaches hit, which platforms registered the username, presence signals, mentions, correlation edges) is derived from that seed — so **the same identifier always produces the identical report**, on every machine, forever. It draws from:

- a catalog of **10 real historical breaches** (names, dates, exposed data classes, real-world scale)
- **14 platform catalogs** with category, URL patterns, and profile metadata templates
- Holehe-style **email-presence signals** for registered/possible/not-registered
- public-web mention templates (repos, forums, websites, documents)

To plug in **real** data sources later, `engine.ts → generateReport()` is the single swap point — the finding schema (§16), scoring, and UI already speak the production shape.

## Privacy Model

- Identifiers are stored **masked** (`j***@example.com`) alongside a **SHA-256 hash** — never in plaintext unless privacy mode is off
- **`after_scan` retention = privacy mode on**: the scan runs entirely in memory, is never written to SQLite, and is wiped on completion
- **No credentials are ever displayed** — breaches list data classes and metadata only (PRD §31)
- `d30` scans auto-expire after 30 days; `until_deleted` scans vanish on DELETE

## Design System — "Dark SOC"

Near-black `#0a0e14` background, phosphor green `#3ddc84` primary accents, amber `#ffb020` warnings, red `#ff4d5e` critical, steel-blue charts (seed-42 palette), JetBrains Mono for data/identifiers, scanline and terminal-log animations during scans. All tokens live in `src/app/globals.css`.

## Roadmap (from the PRD)

- **Phase 1** — Real XposedOrNot API integration with simulated fallback
- **Phase 2** — Domain scan mode with ownership verification (PRD §36)
- **Phase 3** — Live Sherlock/Holehe adapters behind the Scanner interface
- **Later** — PDF/JSON report export, batch scans, light theme

Full product spec: see `FootprintX_PRD.pdf` (58 sections, 8-phase delivery roadmap).

## License

Open source (per the PRD's licensing stance — pick your OSI license before public release; none is bundled yet).
