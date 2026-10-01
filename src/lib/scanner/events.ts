// FootprintX — event-driven scan lifecycle (§42) + progress stages (§29).

import type { Report, ScanConfig, ScanEvent, StageInfo } from "./types";
import { rngFrom } from "./hash";

export interface StageDef {
  key: string;
  label: string;
  detail: string;
  scanner: string;
  deepOnly?: boolean;
}

export const STAGES: StageDef[] = [
  { key: "validate", label: "Validating identifier", detail: "Shape check, normalization, hashing", scanner: "api-gateway" },
  { key: "breach", label: "Checking breach databases", detail: "XposedOrNot breach intelligence", scanner: "breach-worker" },
  { key: "accounts", label: "Checking account associations", detail: "Holehe / Sherlock account discovery", scanner: "accounts-worker" },
  { key: "social", label: "Cross-checking social platforms", detail: "WhatsMyName site registry", scanner: "username-worker", deepOnly: true },
  { key: "web", label: "Searching public web index", detail: "SearXNG-style reference extraction", scanner: "web-worker", deepOnly: true },
  { key: "correlate", label: "Correlating results", detail: "Entity correlation & deduplication", scanner: "correlator", deepOnly: true },
  { key: "risk", label: "Calculating exposure score", detail: "Heuristic risk engine (§25)", scanner: "risk-engine" },
  { key: "report", label: "Generating report", detail: "Digital exposure report assembly", scanner: "report-generator" },
];

export function stagesFor(mode: ScanConfig["mode"]): StageDef[] {
  return STAGES.filter((s) => !(s.deepOnly && mode === "quick"));
}

/** Deterministic per-stage durations (ms). Quick ≈ 4.5s, deep ≈ 9s. */
export function stageDurations(seed: number, mode: ScanConfig["mode"]): number[] {
  const rng = rngFrom(seed ^ 0x5eed);
  const stages = stagesFor(mode);
  return stages.map((s, i) => {
    if (s.key === "validate") return 620 + rng.int(0, 200);
    if (s.key === "report" || s.key === "risk") return 500 + rng.int(0, 250);
    if (i === stages.length - 1) return 600 + rng.int(0, 200);
    return 950 + rng.int(0, 650);
  });
}

export function eventLog(
  config: ScanConfig,
  report: Report,
  durations: number[],
): ScanEvent[] {
  const events: ScanEvent[] = [];
  const stages = stagesFor(config.mode);
  let t = 0;
  const push = (at: number, level: ScanEvent["level"], scope: string, message: string) =>
    events.push({ at, level, scope, message });

  push(0, "info", "gateway", `SCAN_CREATED ${report.scan_id} · type=${config.type} · mode=${config.mode}${config.privacy ? " · privacy-mode" : ""}`);

  stages.forEach((stage, i) => {
    const start = t;
    t += durations[i];
    switch (stage.key) {
      case "validate":
        push(start + 40, "info", "gateway", `identifier validated → ${report.identifier.mask} (sha256 ${report.identifier.hash.slice(0, 12)}…)`);
        push(t, "ok", "gateway", "IDENTIFIER_VALIDATED");
        break;
      case "breach":
        push(start + 90, "info", "breach-worker", "XposedOrNot /v1/check-email → 200 OK (rate limiter: 1/25 window)");
        if (report.breaches.length > 0) {
          push(t - 120, "warn", "breach-worker", `${report.breaches.length} breached organizations matched · earliest ${report.summary.earliest_breach ?? "n/a"}`);
        } else {
          push(t - 120, "ok", "breach-worker", "no breach records matched");
        }
        push(t, "ok", "breach-worker", "BREACH_SCAN_COMPLETED");
        break;
      case "accounts":
        if (config.type === "email") {
          push(start + 90, "info", "accounts-worker", `Holehe → ${report.presence.filter((p) => p.status === "registered").length}/${report.presence.length} services recognize this address`);
        } else {
          const found = report.accounts.filter((a) => ["confirmed", "likely"].includes(a.status)).length;
          push(start + 90, "info", "accounts-worker", `Sherlock → ${found} FOUND / ${report.accounts.length - found} NOT FOUND across ${report.accounts.length} platforms`);
        }
        push(t, "ok", "accounts-worker", "ACCOUNT_SCAN_COMPLETED");
        break;
      case "social":
        push(start + 90, "info", "username-worker", `WhatsMyName registry 2024.3 → ${report.accounts.filter((a) => a.source === "whatsmyname").length} site checks`);
        push(t, "ok", "username-worker", "USERNAME_SCAN_COMPLETED");
        break;
      case "web":
        push(start + 90, "info", "web-worker", `SearXNG (simulated index) → ${report.mentions.length} references extracted, deduplicated by URL`);
        push(t, "ok", "web-worker", "WEB_SCAN_COMPLETED");
        break;
      case "correlate":
        push(start + 90, "info", "correlator", `${report.correlations.length} identity cluster links · confidence range ${
          report.correlations.length
            ? `${Math.round(Math.min(...report.correlations.map((c) => c.confidence)) * 100)}–${Math.round(Math.max(...report.correlations.map((c) => c.confidence)) * 100)}%`
            : "n/a"
        }`);
        push(t, "ok", "correlator", "CORRELATION_COMPLETED");
        break;
      case "risk":
        push(start + 90, "info", "risk-engine", `heuristic weights applied · ${report.score.contributions.filter((c) => c.triggered && c.points > 0).length} rules triggered`);
        push(t, "ok", "risk-engine", `RISK_CALCULATED score=${report.score.score}/100 band=${report.score.band}`);
        break;
      case "report":
        push(t, "ok", "report-generator", "SCAN_COMPLETED · digital exposure report ready");
        break;
    }
  });
  return events;
}

export function computeStageStatuses(
  mode: ScanConfig["mode"],
  createdAt: number,
  durations: number[],
  now: number,
): StageInfo[] {
  const stages = stagesFor(mode);
  let t = createdAt;
  return stages.map((def, i) => {
    const start = t;
    const end = t + durations[i];
    t = end;
    const status: StageInfo["status"] =
      now >= end ? "done" : now >= start ? "active" : "pending";
    return { key: def.key, label: def.label, detail: def.detail, scanner: def.scanner, status };
  });
}
