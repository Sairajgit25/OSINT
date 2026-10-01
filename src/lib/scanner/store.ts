// FootprintX — scan store.
// In-memory worker state for active scans; non-privacy scans are mirrored to
// SQLite for the "recent scans" history (§11 identifier_hash, §37 retention).

import { db } from "@/lib/db";
import { generateReport } from "./engine";
import { eventLog, stageDurations, stagesFor } from "./events";
import { fnv1a, maskIdentifier, sha256 } from "./hash";
import type { Report, ScanConfig, ScanEvent, ScanState, StageInfo } from "./types";
import { computeStageStatuses } from "./events";

const PRIVACY_TTL_MS = 15 * 60 * 1000; // privacy scans auto-purge after completion

interface StoreShape {
  scans: Map<string, ScanState>;
}

const g = globalThis as unknown as { __footprintx_store?: StoreShape };
const store: StoreShape = g.__footprintx_store ?? { scans: new Map() };
g.__footprintx_store = store;

function newId(): string {
  return `scan_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export async function createScan(config: ScanConfig): Promise<ScanState> {
  const id = newId();
  const createdAt = Date.now();
  const seed = fnv1a(`${config.type}:${config.value.trim().toLowerCase()}`);
  const durations = stageDurations(seed, config.mode);
  const report = generateReport(id, config, createdAt);
  const state: ScanState = {
    id,
    config,
    status: "queued",
    createdAt,
    stageDurations: durations,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    report,
    persisted: false,
  };
  store.scans.set(id, state);

  // §37 Privacy Mode — never touch the database
  if (!config.privacy) {
    try {
      await db.scanRecord.create({
        data: {
          id,
          identifierType: config.type,
          identifierMask: maskIdentifier(config.type, config.value.trim().toLowerCase()),
          identifierHash: sha256(config.value.trim().toLowerCase()),
          identifierRaw: config.value.trim().toLowerCase(),
          mode: config.mode,
          privacyMode: false,
          retention: config.retention,
          status: "running",
          summary: JSON.stringify(report.summary),
          findings: null, // written on completion
          expiresAt: config.retention === "d30" ? new Date(createdAt + 30 * 24 * 3600 * 1000) : null,
        },
      });
      state.persisted = true;
    } catch {
      // DB unavailable — degrade gracefully to memory-only
    }
  }
  return state;
}

export async function getScan(id: string): Promise<ScanState | null> {
  purgeExpired();
  const memory = store.scans.get(id);
  if (memory) return memory;
  // Rehydrate persisted (non-privacy) scans after a server restart
  try {
    const rec = await db.scanRecord.findUnique({ where: { id } });
    if (!rec || rec.status === "deleted") return null;
    const config: ScanConfig = {
      type: rec.identifierType as ScanConfig["type"],
      value: rec.identifierRaw ?? "",
      mode: rec.mode as ScanConfig["mode"],
      privacy: false,
      retention: rec.retention as ScanConfig["retention"],
    };
    if (rec.findings) {
      const report = JSON.parse(rec.findings) as Report;
      const seed = fnv1a(`${config.type}:${config.value.trim().toLowerCase()}`);
      const durations = stageDurations(seed, config.mode);
      const state: ScanState = {
        id,
        config,
        status: "completed",
        createdAt: rec.createdAt.getTime(),
        stageDurations: durations,
        totalDuration: durations.reduce((a, b) => a + b, 0),
        report,
        persisted: true,
      };
      store.scans.set(id, state);
      return state;
    }
  } catch {
    // ignore
  }
  return null;
}

export interface ScanStatusPayload {
  scan_id: string;
  status: ScanState["status"];
  mode: ScanConfig["mode"];
  privacy: boolean;
  retention: ScanConfig["retention"];
  identifier_mask: string;
  progress: number; // 0..1
  elapsed_ms: number;
  total_ms: number;
  stages: StageInfo[];
  events: ScanEvent[];
  score: { value: number; band: string } | null;
  auto_delete_at: number | null;
}

export function statusPayload(state: ScanState, now = Date.now()): ScanStatusPayload {
  const elapsed = Math.max(0, now - state.createdAt);
  const done = elapsed >= state.totalDuration;
  if (done && state.status !== "completed") state.status = "completed";
  else if (!done && state.status === "queued" && elapsed > 0) state.status = "running";

  const events = state.report ? eventLog(state.config, state.report, state.stageDurations) : [];
  const visibleEvents = events.filter((e) => e.at <= elapsed);
  const stages = computeStageStatuses(state.config.mode, state.createdAt, state.stageDurations, now);

  return {
    scan_id: state.id,
    status: done ? "completed" : elapsed > 0 ? "running" : "queued",
    mode: state.config.mode,
    privacy: state.config.privacy,
    retention: state.config.retention,
    identifier_mask: state.report?.identifier.mask ?? "",
    progress: Math.min(1, elapsed / state.totalDuration),
    elapsed_ms: elapsed,
    total_ms: state.totalDuration,
    stages,
    events: visibleEvents,
    score: done && state.report ? { value: state.report.score.score, band: state.report.score.band } : null,
    auto_delete_at: state.config.privacy ? state.createdAt + state.totalDuration + PRIVACY_TTL_MS : null,
  };
}

/** Persist the completed report for non-privacy scans. */
export async function finalizeIfCompleted(state: ScanState): Promise<void> {
  const elapsed = Date.now() - state.createdAt;
  if (elapsed < state.totalDuration || state.status !== "completed" || !state.report) return;
  if (state.config.privacy || !state.persisted) return;
  try {
    await db.scanRecord.update({
      where: { id: state.id },
      data: {
        status: "completed",
        riskScore: state.report.score.score,
        severityBand: state.report.score.band,
        findings: JSON.stringify(state.report),
        completedAt: new Date(),
      },
    });
  } catch {
    // ignore
  }
}

export async function deleteScan(id: string): Promise<boolean> {
  const memory = store.scans.get(id);
  const wasPersisted = memory?.persisted ?? false;
  store.scans.delete(id);
  try {
    await db.scanRecord.updateMany({
      where: { id },
      data: { status: "deleted", findings: null },
    });
  } catch {
    // ignore
  }
  return memory !== undefined || wasPersisted;
}

export interface RecentScan {
  id: string;
  identifier_mask: string;
  identifier_type: string;
  mode: string;
  risk_score: number | null;
  severity_band: string | null;
  status: string;
  created_at: string;
  privacy: boolean;
  persisted: boolean;
  retention: string;
}

export async function recentScans(limit = 6): Promise<RecentScan[]> {
  const persisted: RecentScan[] = [];
  try {
    const rows = await db.scanRecord.findMany({
      where: { status: { not: "deleted" } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    for (const r of rows) {
      persisted.push({
        id: r.id,
        identifier_mask: r.identifierMask,
        identifier_type: r.identifierType,
        mode: r.mode,
        risk_score: r.riskScore,
        severity_band: r.severityBand,
        status: r.status,
        created_at: r.createdAt.toISOString(),
        privacy: r.privacyMode,
        persisted: true,
        retention: r.retention,
      });
    }
    return persisted;
  } catch {
    // fall through to memory
  }
  const memory = [...store.scans.values()]
    .filter((s) => s.config.privacy)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      identifier_mask: s.report?.identifier.mask ?? "",
      identifier_type: s.config.type,
      mode: s.config.mode,
      risk_score: s.report?.score.score ?? null,
      severity_band: s.report?.score.band ?? null,
      status: statusPayload(s).status,
      created_at: new Date(s.createdAt).toISOString(),
      privacy: true,
      persisted: false,
      retention: s.config.retention,
    }));
  return memory;
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, s] of store.scans) {
    if (s.config.privacy && now > s.createdAt + s.totalDuration + PRIVACY_TTL_MS) {
      store.scans.delete(id);
    }
  }
}

export { stagesFor };
