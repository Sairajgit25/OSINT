// FootprintX — Breaches tab (§31): never show passwords, always show actions

"use client";

import { Lock, Calendar, Database, ArrowRight } from "lucide-react";
import type { Report } from "@/lib/scanner/types";
import { SeverityBadge, SourceTag, formatCount } from "../shared";

const SEVERITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 } as const;

export function BreachesTab({ report }: { report: Report }) {
  const breaches = [...report.breaches].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.breach_date.localeCompare(a.breach_date),
  );

  if (breaches.length === 0) {
    return (
      <div className="rounded-lg border border-xgreen/25 bg-xgreen/[0.05] p-6 text-center">
        <Lock className="mx-auto h-6 w-6 text-xgreen" aria-hidden />
        <h3 className="mt-3 font-mono text-sm font-semibold tracking-wider text-xgreen">
          NO KNOWN BREACHES MATCHED
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          This identifier did not match any breach record in the simulated corpus. Breach
          monitoring (§56) can watch for future exposure — with your explicit opt-in only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-xred/25 bg-xred/[0.05] p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-xred" aria-hidden />
        <p className="text-xs leading-relaxed text-secondary-foreground">
          <span className="font-semibold text-foreground">No credentials are ever displayed.</span>{" "}
          FootprintX reports breach metadata — affected organization, date, and exposed data
          categories — never passwords, hashes or raw values (§31).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {breaches.map((b) => (
          <article key={b.id} className="rounded-lg border border-border bg-card/70 p-4 sm:p-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{b.platform}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {b.breach_date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Database className="h-3 w-3" aria-hidden />
                    {formatCount(b.pwn_count)} records
                  </span>
                  <span>{b.verified ? "verified breach" : "unverified"}</span>
                </div>
              </div>
              <SeverityBadge severity={b.severity} />
            </header>

            <div className="mt-3">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">
                EXPOSED CATEGORIES
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {b.data_types.map((d) => (
                  <span
                    key={d}
                    className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{b.story}</p>

            <div className="mt-3 rounded-md border border-border/70 bg-background/50 p-2.5">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-xgreen/80">
                WHAT TO DO
              </div>
              <ul className="mt-1.5 space-y-1">
                {[
                  /password/i.test(b.data_types.join(" "))
                    ? "Change your password on this service — and everywhere you reused it"
                    : "Audit this account's recovery options",
                  "Enable multi-factor authentication",
                  "Check related accounts that share the same credentials",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-secondary-foreground">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-xgreen/70" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <footer className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
              <span className="truncate font-mono text-[10px] text-muted-foreground/70">
                matched: {b.matched_by}
              </span>
              <span className="flex items-center gap-1.5">
                <SourceTag source={b.source} />
                <span className="font-mono text-[9px] text-muted-foreground/60">v{b.evidence.scanner_version}</span>
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
