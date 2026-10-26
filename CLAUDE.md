# CLAUDE.md

Context file for AI coding assistants (Claude Code, Cursor, etc.) working in this repository.

## What This Project Is

**FootprintX** — an open-source, privacy-first **defensive OSINT** tool. A user enters their own email or username and receives a structured digital-exposure report: breach history, registered accounts, public web mentions, an identity-correlation graph, and a weighted risk score with remediation steps.

The product spec is a 58-section PRD (see `FootprintX_PRD.pdf` if present in the workspace). Code comments reference PRD sections as `§NN` (e.g. `§16` = unified finding schema, `§25` = risk scoring, `§37` = privacy mode). When a task mentions a section number, consult the PRD.

### ⚠️ MOST IMPORTANT CONTEXT: the data engine is 100% SIMULATED

v0.1 makes **zero external network requests**. Every finding is deterministically generated from the identifier (FNV-1a hash → mulberry32 PRNG seed). Same identifier → identical report, always, on any machine. The catalogs are *modeled on* XposedOrNot, Sherlock, Holehe, and WhatsMyName but contain **no live integrations**. Do not "fix" the app by adding real API calls without explicit instruction — the offline/deterministic behavior is a deliberate safety and demo feature. `src/lib/scanner/engine.ts → generateReport()` is the single swap point for real data sources.

## Current State (v0.1 — complete & verified)

Everything below is **built, linted, and browser-tested** (ESLint clean, API curl-tested, golden path verified end-to-end, responsive at 390px):

- Consent gate dialog (§4) — scan button activates only after informed opt-in
- Scan flow: home → progress view (§29 stage checklist + §42 terminal event log + scanline animation) → results dashboard
- 8 result tabs: Overview, Accounts (§32 confidence grading), Breaches (§31 — never shows credentials), Public Web, Identity Graph (React Flow, edges carry confidence), Risk (§25 itemized scoring + animated gauge), Recommendations (interactive checklist), Evidence (§43 source attribution)
- Full REST API (`/api/v1/scans`, `/api/v1/scans/{id}`, `/api/v1/scans/{id}/results`, `/api/v1/scanners`)
- Privacy mode (§37): `after_scan` retention → in-memory only, never persisted, wiped on completion
- Persistence: masked identifier + SHA-256 hash always; raw identifier only when privacy mode is off
- Dark SOC design system (near-black + phosphor green/amber), Recharts visualizations (seed-42 steel-blue palette)

## Commands

```bash
npm run dev        # dev server on :3000 (hot reload) — primary workflow
npm run lint       # ESLint
npm run db:push    # sync prisma/schema.prisma → db/custom.db (idempotent)
npm run build      # production build (standalone output + scripts/copy-standalone.js asset copy)
npm run start      # serve production build with plain node (.next/standalone/server.js)
```

npm scripts are **cross-platform (Windows cmd.exe-safe)** — no Unix-only `tee`, `cp`, or inline `NODE_ENV=...` anywhere. `scripts/` holds plain Node utility scripts (build helper, docs tooling) and is excluded from ESLint via `ignores` in `eslint.config.mjs`; do not move app code there.

`.env` must contain `DATABASE_URL="file:../db/custom.db"` — Prisma resolves this **relative to `prisma/schema.prisma`**, so it points to `db/custom.db` at the project root. Do not commit a local absolute path.

## Architecture

### App flow (single-page App Router)

`src/app/page.tsx` mounts `src/components/footprint/app.tsx`, a client state machine with three phases: **home** (`home-view.tsx`, scan form + consent) → **progress** (`progress-view.tsx`, polls scan status) → **results** (`results-view.tsx`, tab shell). Supporting components: `consent-dialog.tsx`, `header.tsx`, `stat-cards.tsx`, `score-gauge.tsx`, `shared.tsx` (badges/labels), and one file per tab under `tabs/`.

### API routes (all under `src/app/api/v1/`)

| Route file | Verbs | Purpose |
|---|---|---|
| `scans/route.ts` | POST, GET | Create scan (validates via `validateIdentifier`, 422 on bad input); GET returns 6 most recent |
| `scans/[id]/route.ts` | GET, DELETE | Status payload with stage progress; DELETE honors `until_deleted` |
| `scans/[id]/results/route.ts` | GET | Full report JSON (404 until `completed`) |
| `scanners/route.ts` | GET | Scanner registry: versions + health (§45) |

Note: `POST /api/v1/scans` derives `privacy` server-side — `retention: "after_scan"` forces privacy mode on regardless of what the client sends.

### The scanner engine (`src/lib/scanner/` — the heart of the app)

| Module | Role |
|---|---|
| `types.ts` | §16 unified finding schema: `BreachFinding`, `AccountFinding`, `PresenceFinding`, `MentionFinding`, `Correlation`, `RiskAssessment`, `Report`, `ScanState`, etc. |
| `hash.ts` | `fnv1a`, `sha256`, `mulberry32`/`rngFrom` (seeded RNG), `maskIdentifier` (j***@example.com), `validateIdentifier`, `isoAt` |
| `catalog.ts` | Static catalogs: `BREACH_CATALOG` (10 real historical breaches), `PLATFORM_CATALOG` (14 platforms), `PRESENCE_CATALOG`, `MENTION_TEMPLATES`, `SCANNER_VERSIONS`, `SCANNER_HEALTH` |
| `engine.ts` | `generateReport(config)` — deterministic report generation from the identifier seed |
| `scoring.ts` | `computeRisk` (§25 weighted model) + `bandFor` (critical/high/moderate/low bands) |
| `recommendations.ts` | `buildRecommendations` — maps findings → remediation checklist |
| `events.ts` | `STAGES`, `stagesFor(mode)`, `stageDurations`, `eventLog` (§42), `computeStageStatuses` (§29) |
| `store.ts` | Scan lifecycle: `createScan`, `getScan`, `statusPayload`, `finalizeIfCompleted`, `deleteScan`, `recentScans`. Persists to Prisma **except privacy-mode scans** (in-memory map only) |

### Data model (`prisma/schema.prisma`)

Single model `ScanRecord`: id (uuid), identifierType, identifierMask (always masked form), identifierHash (sha256), identifierRaw (nullable — only when privacy off), mode, privacyMode, retention (`d30`/`until_deleted`/`after_scan`), status, riskScore, severityBand, summary JSON, findings JSON (full report payload), createdAt/completedAt/expiresAt (d30 = +30 days).

## Hard Rules (do not violate these when editing)

1. **Never display credentials or password data** — not in UI, not in API payloads (PRD §31). Breach findings expose data *classes* and metadata only.
2. **Respect the §26 confidence vocabulary** — `confirmed | likely | possible | not_found | unknown`. Never conflate "found" with "confirmed".
3. **Privacy-mode scans (`after_scan`) must never touch the database** — keep them in the in-memory store and wipe them on completion. Check `store.ts` behavior if you touch persistence.
4. **The engine must stay deterministic** — no `Math.random()`, no `Date.now()` inside report generation (timestamps derive from the seed via `isoAt`). Breaking determinism breaks reproducibility guarantees.
5. **Store identifiers masked + hashed** (`maskIdentifier` / sha256). Raw identifier only ever persists when privacy mode is off.
6. **Design tokens live in `src/app/globals.css`** — Dark SOC palette (bg `#0a0e14`, primary `#3ddc84`, warning `#ffb020`, critical `#ff4d5e`), JetBrains Mono for identifiers/data. Don't hardcode ad-hoc hex values in components; use the tokens.
7. Charts use the seed-42 steel-blue Recharts palette (see Overview/Risk tabs) — keep new charts consistent.

## Common Tasks → Files to Touch

| Task | Edit |
|---|---|
| Add a breach / platform / presence source | `catalog.ts` (append to the relevant catalog; engine picks it up automatically) |
| Tune risk weights / severity thresholds | `scoring.ts` (weights table + `bandFor` cutoffs) |
| Add/modify remediation advice | `recommendations.ts` |
| Change scan stage names/durations/event log | `events.ts` (STAGES + templates) |
| Add a real data source (later phases) | Replace the body of `generateReport()` in `engine.ts`; keep the §16 finding types as the contract |
| Add a result tab | New file in `src/components/footprint/tabs/` + register in `results-view.tsx` |
| Modify scan lifecycle/persistence | `store.ts` (+ `prisma/schema.prisma` if fields change → `npm run db:push`) |
| Adjust API validation | `scans/route.ts` + `validateIdentifier` in `hash.ts` |

## Testing Checklist (run after meaningful changes)

1. `npm run lint` — must pass
2. Golden path in browser: consent dialog → submit scan → progress stages animate → results dashboard renders all 8 tabs
3. API: `POST /api/v1/scans` (valid email) → poll `GET .../scans/{id}` until `completed` → `GET .../scans/{id}/results` returns full report
4. Validation: POST with `type: "phone"` → 400; malformed email → 422
5. Privacy isolation: POST with `retention: "after_scan"` → after completion, `GET .../scans/{id}` should reflect the no-persistence behavior and the scan must not appear in `GET /api/v1/scans` history
6. Determinism: the same identifier scanned twice yields identical findings/risk score

## Known Limitations / Deliberate Mocks

- Scanner "health" and versions in `/api/v1/scanners` are static catalog values
- All breach dates, platform profiles, follower counts, mentions, and correlation edges are seeded fabrications
- No authentication, no rate limiting, no export (PDF/JSON) yet, no batch scans, no domain mode (§36)
- `next.config.ts` has `typescript.ignoreBuildErrors: true` (inherited scaffold setting) — rely on `npm run lint` and editor type-checking; don't add new type errors
