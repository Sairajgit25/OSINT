// FootprintX — Identity Graph tab wrapper (§34): loads React Flow client-side only

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Report } from "@/lib/scanner/types";

const IdentityGraph = dynamic(() => import("./identity-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-[#060a08]">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-xgreen" aria-hidden />
        loading graph engine…
      </div>
    </div>
  ),
});

const LEGEND: { color: string; label: string }[] = [
  { color: "bg-xgreen", label: "Identifier" },
  { color: "bg-xteal", label: "Account / presence" },
  { color: "bg-xred", label: "Breach" },
  { color: "bg-xamber", label: "Shared attribute" },
];

export function IdentityGraphTab({ report }: { report: Report }) {
  const clusters = report.correlations.length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
          IDENTITY GRAPH · §34
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <span className={`h-2 w-2 rounded-sm ${l.color}`} aria-hidden />
              {l.label}
            </span>
          ))}
        </div>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
          {report.graph.nodes.length} nodes · {report.graph.edges.length} links · {clusters} correlations
        </span>
      </div>

      <IdentityGraph graph={report.graph} />

      {/* Correlation cards (§27) */}
      {report.correlations.length > 0 && (
        <section aria-label="Identity correlations">
          <h3 className="mb-2.5 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
            CORRELATION CLUSTERS · §27
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {report.correlations.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {c.pair[0]} ↔ {c.pair[1]}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      c.confidence >= 0.75 ? "text-xgreen" : c.confidence >= 0.55 ? "text-xamber" : "text-muted-foreground"
                    }`}
                  >
                    {Math.round(c.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.signals.map((s) => (
                    <span
                      key={s.label}
                      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${
                        s.matched
                          ? "border-xgreen/30 bg-xgreen/[0.07] text-xgreen/90"
                          : "border-border bg-muted/50 text-muted-foreground/70"
                      }`}
                    >
                      {s.matched ? "✓" : "✗"} {s.label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{c.verdict}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
        Correlation confidence is a function of independent matching signals (§27). It is never
        presented as verified identity. Graph view is a Phase 7 preview — production targets Neo4j
        (§14, §55).
      </p>
    </div>
  );
}
