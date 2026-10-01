// FootprintX — scan progress console (§29 staged checklist, §42 event stream)

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Circle, Loader2, X, EyeOff, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Report, ScanConfig, ScanEvent, ScanStatusPayload, StageInfo } from "@/lib/scanner/types";

function ts(offsetMs: number): string {
  return `+${(offsetMs / 1000).toFixed(2).padStart(6, "0")}s`;
}

const SCOPE_COLORS: Record<string, string> = {
  gateway: "text-xteal",
  "breach-worker": "text-xgreen/85",
  "accounts-worker": "text-xamber/80",
  "username-worker": "text-xgreen/85",
  "web-worker": "text-xteal/80",
  correlator: "text-xgreen",
  "risk-engine": "text-xamber",
  "report-generator": "text-xgreen",
};

export function ProgressView({
  scanId,
  config,
  onComplete,
  onAbort,
}: {
  scanId: string;
  config: ScanConfig;
  onComplete: (report: Report) => void;
  onAbort: () => void;
}) {
  const [status, setStatus] = useState<ScanStatusPayload | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const abortRef = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (abortRef.current) return;
      try {
        const res = await fetch(`/api/v1/scans/${scanId}`, { cache: "no-store" });
        if (res.status === 404) {
          setError("Scan expired or was deleted.");
          return;
        }
        const body = (await res.json()) as ScanStatusPayload;
        setStatus(body);
        setEvents(body.events);
        setStages(body.stages);
        if (body.status === "completed" && !completedRef.current) {
          completedRef.current = true;
          const r = await fetch(`/api/v1/scans/${scanId}/results`, { cache: "no-store" });
          if (r.ok) {
            const report = (await r.json()) as Report;
            // small beat so the final event is readable before transition
            setTimeout(() => onComplete(report), 700);
            return;
          }
        }
      } catch {
        setError("Lost connection to the scan worker. Retrying…");
      }
      timer = setTimeout(poll, 650);
    };

    poll();
    return () => {
      clearTimeout(timer);
      abortRef.current = false;
    };
  }, [scanId, onComplete]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  const abort = useCallback(async () => {
    abortRef.current = true;
    try {
      await fetch(`/api/v1/scans/${scanId}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    onAbort();
  }, [scanId, onAbort]);

  const progressPct = Math.round((status?.progress ?? 0) * 100);
  const elapsedS = ((status?.elapsed_ms ?? 0) / 1000).toFixed(1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-mono text-sm font-bold tracking-[0.22em] text-foreground">
          SCANNING DIGITAL FOOTPRINT
        </h1>
        <span className="font-mono text-xs text-xgreen">{status?.identifier_mask ?? "…"}</span>
        <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground">
          {config.mode.toUpperCase()}
        </span>
        {config.privacy && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-xamber/40 bg-xamber/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-xamber">
            <EyeOff className="h-3 w-3" aria-hidden />
            PRIVACY MODE
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] tracking-wider text-muted-foreground">
          {scanId}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
        {/* Stage checklist (§29) */}
        <div className="rounded-xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="mb-4 font-mono text-[10px] font-semibold tracking-[0.24em] text-muted-foreground">
            PIPELINE · §29
          </div>
          <ol className="space-y-1">
            {(stages.length ? stages : []).map((stage, i) => (
              <li
                key={stage.key}
                className={cn(
                  "flex items-start gap-3 rounded-md px-2 py-2 transition",
                  stage.status === "active" && "bg-xgreen/[0.07]",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {stage.status === "done" ? (
                    <Check className="h-4 w-4 text-xgreen" aria-label="completed" />
                  ) : stage.status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-xgreen" aria-label="in progress" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/35" aria-label="pending" />
                  )}
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-sm leading-tight",
                      stage.status === "done"
                        ? "text-secondary-foreground"
                        : stage.status === "active"
                          ? "font-medium text-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    <span className="mr-2 font-mono text-[10px] text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {stage.label}
                  </div>
                  {stage.status !== "pending" && (
                    <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
                      {stage.detail} · {stage.scanner}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-muted-foreground">
              <span>PROGRESS</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <Progress
              value={progressPct}
              className="mt-2 h-1.5 bg-foreground/10 [&>div]:bg-xgreen"
            />
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
              <span>{elapsedS}s elapsed</span>
              <span>worker: async</span>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={abort}
            className="mt-4 w-full rounded-md font-mono text-[11px] tracking-[0.14em] text-muted-foreground hover:bg-xred/10 hover:text-xred"
          >
            <X className="mr-2 h-3.5 w-3.5" aria-hidden />
            ABORT SCAN
          </Button>
        </div>

        {/* Terminal event stream (§42) */}
        <div className="relative overflow-hidden rounded-xl border border-xgreen/20 bg-[#030604]">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <Terminal className="h-3.5 w-3.5 text-xgreen" aria-hidden />
            <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
              EVENT STREAM · §42
            </span>
            <span className="ml-auto font-mono text-[10px] text-xgreen/70">
              {events.length} events
            </span>
          </div>
          <div className="fx-scanline" aria-hidden />
          <div
            ref={logRef}
            className="fx-scroll h-[320px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed sm:h-[380px]"
            role="log"
            aria-live="polite"
          >
            {events.length === 0 && (
              <div className="text-muted-foreground/50">
                <span className="fx-blink">▊</span> waiting for worker dispatch…
              </div>
            )}
            {events.map((e, i) => (
              <div key={i} className="flex gap-2 whitespace-pre-wrap">
                <span className={cn("w-[70px] shrink-0 tabular-nums text-muted-foreground/50", "")}>
                  [{ts(e.at)}]
                </span>
                <span
                  className={cn(
                    "w-[110px] shrink-0 truncate",
                    SCOPE_COLORS[e.scope] ?? "text-muted-foreground",
                  )}
                >
                  {e.scope}
                </span>
                <span
                  className={cn(
                    e.level === "ok" && "text-xgreen/90",
                    e.level === "info" && "text-secondary-foreground/85",
                    e.level === "warn" && "text-xamber",
                    e.level === "error" && "text-xred",
                  )}
                >
                  {e.message}
                </span>
              </div>
            ))}
            {status?.status !== "completed" && events.length > 0 && (
              <div className="text-xgreen/70">
                <span className="fx-blink">▊</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-center font-mono text-xs text-xred" role="alert">
          {error}
        </p>
      )}

      <p className="mt-6 text-center font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
        Scanners run as queued workers with rate limiting (§44). Findings appear only after
        normalization and confidence scoring (§16, §26).
      </p>
    </div>
  );
}
