// FootprintX — results dashboard (§30): score hero, stat cards, 8 tabs

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  RotateCcw,
  EyeOff,
  Clock,
  FileCheck2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Report, ScanConfig } from "@/lib/scanner/types";
import { ScoreGauge } from "./score-gauge";
import { StatCards } from "./stat-cards";
import { OverviewTab } from "./tabs/overview";
import { AccountsTab } from "./tabs/accounts";
import { BreachesTab } from "./tabs/breaches";
import { PublicWebTab } from "./tabs/public-web";
import { IdentityGraphTab } from "./tabs/identity-graph-tab";
import { RiskTab } from "./tabs/risk";
import { RecommendationsTab } from "./tabs/recommendations";
import { EvidenceTab } from "./tabs/evidence";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "accounts", label: "Accounts" },
  { value: "breaches", label: "Breaches" },
  { value: "web", label: "Public Web" },
  { value: "graph", label: "Identity Graph" },
  { value: "risk", label: "Risk" },
  { value: "recommendations", label: "Recommendations" },
  { value: "evidence", label: "Evidence" },
];

export function ResultsView({
  scanId,
  report,
  config,
  onNewScan,
  onDeleted,
}: {
  scanId: string;
  report: Report;
  config: ScanConfig | null;
  onNewScan: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `footprintx-report-${scanId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported", description: "Unified finding schema (§16) saved as JSON." });
  };

  const deleteScan = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/v1/scans/${scanId}`, { method: "DELETE" });
      toast({
        title: "Scan deleted",
        description: report.privacy
          ? "Privacy-mode scan purged from memory (§37)."
          : "Record and stored findings removed.",
      });
      onDeleted();
    } catch {
      toast({ title: "Delete failed", description: "Scan could not be deleted.", variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      {/* Report header */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <FileCheck2 className="h-5 w-5 text-xgreen" aria-hidden />
        <h1 className="font-mono text-sm font-bold tracking-[0.22em] text-foreground">
          DIGITAL EXPOSURE REPORT
        </h1>
        <span className="font-mono text-xs text-xgreen">{report.identifier.mask}</span>
        <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground">
          {report.mode.toUpperCase()}
        </span>
        {report.privacy && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-xamber/40 bg-xamber/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-xamber">
            <EyeOff className="h-3 w-3" aria-hidden />
            PRIVACY MODE · AUTO-DELETE
          </span>
        )}
        <span className="ml-auto hidden items-center gap-1 font-mono text-[10px] tabular-nums text-muted-foreground sm:inline-flex">
          <Clock className="h-3 w-3" aria-hidden />
          {new Date(report.generated_at).toISOString().replace("T", " ").slice(0, 19)} UTC
        </span>
      </div>

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={downloadJson}
          variant="outline"
          className="h-9 rounded-md border-border bg-card font-mono text-[11px] tracking-[0.1em] hover:border-xgreen/40 hover:text-xgreen"
        >
          <Download className="mr-2 h-3.5 w-3.5" aria-hidden />
          EXPORT JSON
        </Button>
        <Button
          onClick={deleteScan}
          disabled={deleting}
          variant="outline"
          className="h-9 rounded-md border-border bg-card font-mono text-[11px] tracking-[0.1em] hover:border-xred/40 hover:text-xred"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden />
          {report.privacy ? "PURGE NOW" : "DELETE SCAN"}
        </Button>
        <Button
          onClick={onNewScan}
          variant="outline"
          className="h-9 rounded-md border-border bg-card font-mono text-[11px] tracking-[0.1em] hover:border-xgreen/40 hover:text-xgreen"
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden />
          NEW SCAN
        </Button>
      </div>

      {/* Score hero (§30) */}
      <section className="mt-6 fx-glow-box rounded-xl border border-xgreen/25 bg-card/80 p-5 sm:p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.3em] text-muted-foreground">
              DIGITAL EXPOSURE
            </div>
            <ScoreGauge score={report.score.score} band={report.score.band} />
          </div>
          <div className="w-full">
            <StatCards summary={report.summary} />
            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
              {report.privacy
                ? "Privacy mode: this report lives in memory only and is purged automatically (§37). Export it now if you need it."
                : config?.retention === "d30"
                  ? "Stored for 30 days under the selected retention policy, then purged automatically (§37)."
                  : "Stored until you delete it under the selected retention policy (§37)."}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs (§30) */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="fx-scroll h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-card/60 p-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "rounded-md px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground transition",
                "data-[state=active]:bg-xgreen/10 data-[state=active]:text-xgreen data-[state=active]:shadow-none",
              )}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab report={report} />
        </TabsContent>
        <TabsContent value="accounts" className="mt-4">
          <AccountsTab report={report} />
        </TabsContent>
        <TabsContent value="breaches" className="mt-4">
          <BreachesTab report={report} />
        </TabsContent>
        <TabsContent value="web" className="mt-4">
          <PublicWebTab report={report} />
        </TabsContent>
        <TabsContent value="graph" className="mt-4">
          <IdentityGraphTab report={report} />
        </TabsContent>
        <TabsContent value="risk" className="mt-4">
          <RiskTab report={report} />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-4">
          <RecommendationsTab report={report} />
        </TabsContent>
        <TabsContent value="evidence" className="mt-4">
          <EvidenceTab report={report} />
        </TabsContent>
      </Tabs>

      {/* Scan provenance */}
      <div className="mt-8 rounded-lg border border-border bg-card/50 p-4">
        <div className="font-mono text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">
          PROVENANCE
        </div>
        <div className="mt-2 grid gap-x-6 gap-y-1 font-mono text-[10px] text-muted-foreground sm:grid-cols-2">
          <div>scan_id: <span className="text-secondary-foreground">{scanId}</span></div>
          <div>identifier_hash: <span className="text-secondary-foreground">{report.identifier.hash.slice(0, 24)}…</span></div>
          <div>mode: <span className="text-secondary-foreground">{report.mode}</span></div>
          <div>
            scanners:{" "}
            <span className="text-secondary-foreground">
              {Object.entries(report.scanner_versions)
                .filter(([, v]) => v !== "not-configured")
                .map(([k, v]) => `${k}@${v}`)
                .join(" · ")}
            </span>
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
          Simulated build: findings are deterministically synthesized from the identifier hash.
          Production targets the architecture in §7 — FastAPI gateway, Celery workers, Redis
          queues, PostgreSQL storage — with the same unified finding schema (§16).
        </p>
      </div>
    </div>
  );
}
