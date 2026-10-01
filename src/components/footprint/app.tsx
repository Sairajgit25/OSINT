// FootprintX — root application state machine (home → scanning → results)

"use client";

import { useCallback, useState } from "react";
import { AppHeader } from "./header";
import { HomeView } from "./home-view";
import { ProgressView } from "./progress-view";
import { ResultsView } from "./results-view";
import type { Report, ScanConfig } from "@/lib/scanner/types";

type View = "home" | "scanning" | "results";

export function FootprintApp() {
  const [view, setView] = useState<View>("home");
  const [scanId, setScanId] = useState<string | null>(null);
  const [config, setConfig] = useState<ScanConfig | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const startScan = useCallback(async (cfg: ScanConfig) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: cfg.type,
          value: cfg.value,
          mode: cfg.mode,
          retention: cfg.retention,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to start scan.");
      }
      const body = (await res.json()) as { scan_id: string };
      setConfig(cfg);
      setScanId(body.scan_id);
      setReport(null);
      setView("scanning");
    } catch (err) {
      setSubmitting(false);
      throw err;
    }
    setSubmitting(false);
  }, []);

  const onComplete = useCallback((r: Report) => {
    setReport(r);
    setView("results");
  }, []);

  const goHome = useCallback(() => {
    setView("home");
    setScanId(null);
    setReport(null);
    setConfig(null);
    setHistoryKey((k) => k + 1);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 fx-bg-grid fx-vignette" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">
          {view === "home" && (
            <HomeView onStart={startScan} submitting={submitting} historyKey={historyKey} />
          )}
          {view === "scanning" && scanId && config && (
            <ProgressView
              scanId={scanId}
              config={config}
              onComplete={onComplete}
              onAbort={goHome}
            />
          )}
          {view === "results" && report && scanId && (
            <ResultsView
              scanId={scanId}
              report={report}
              config={config}
              onNewScan={goHome}
              onDeleted={goHome}
            />
          )}
        </main>
        <footer className="mt-auto border-t border-border/60 bg-background/70 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <p className="font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
                FOOTPRINTX v0.1 · OPEN SOURCE · DEFENSIVE PRIVACY TOOL
              </p>
              <p className="font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
                TARGET STACK: FASTAPI · CELERY · REDIS · POSTGRESQL ·{" "}
                <span className="text-foreground/70">THIS DEMO: NEXT.JS API + SQLITE</span>
              </p>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
              Only scan identifiers that you own or have explicit authorization to assess. This
              build synthesizes findings deterministically offline — no external requests are made,
              no real accounts are queried, and no credentials are ever displayed.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
