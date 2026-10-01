// FootprintX — Recommendations tab (§35): actions, never just "you are exposed"

"use client";

import { useState } from "react";
import { CheckSquare, Square, AlertTriangle, EyeOff, Wrench, Radar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Recommendation, Report } from "@/lib/scanner/types";

const CATEGORY_META: Record<
  Recommendation["category"],
  { icon: typeof AlertTriangle; label: string }
> = {
  action: { icon: AlertTriangle, label: "ACTION REQUIRED" },
  privacy: { icon: EyeOff, label: "PRIVACY IMPROVEMENT" },
  hygiene: { icon: Wrench, label: "HYGIENE" },
  monitoring: { icon: Radar, label: "MONITORING" },
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-xred/40",
  high: "border-[#fb923c]/40",
  moderate: "border-xamber/40",
  low: "border-border",
};

export function RecommendationsTab({ report }: { report: Report }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const key = (r: Recommendation, i: number) => `${r.id}:${i}`;

  const totalItems = report.recommendations.reduce((n, r) => n + r.items.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card/70 px-4 py-3">
        <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">
          REMEDIATION PROGRESS
        </span>
        <Progress
          value={totalItems ? (doneCount / totalItems) * 100 : 0}
          className="h-1.5 flex-1 bg-foreground/10 [&>div]:bg-xgreen"
        />
        <span className="font-mono text-xs tabular-nums text-xgreen">
          {doneCount}/{totalItems}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {report.recommendations.map((rec) => {
          const meta = CATEGORY_META[rec.category];
          const recDone = rec.items.filter((_, i) => done[key(rec, i)]).length;
          return (
            <article
              key={rec.id}
              className={cn(
                "rounded-xl border bg-card/70 p-4 sm:p-5",
                SEVERITY_BORDER[rec.severity],
                recDone === rec.items.length && "opacity-70",
              )}
            >
              <header className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em]">
                  <meta.icon
                    className={cn(
                      "h-3.5 w-3.5",
                      rec.severity === "critical" || rec.severity === "high" ? "text-xred" : "text-xamber",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      rec.severity === "critical" || rec.severity === "high" ? "text-xred" : "text-xamber",
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {rec.severity}
                </span>
              </header>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{rec.title}</h3>
              <ul className="mt-3 space-y-1">
                {rec.items.map((item, i) => {
                  const k = key(rec, i);
                  return (
                    <li key={k}>
                      <button
                        onClick={() => setDone((d) => ({ ...d, [k]: !d[k] }))}
                        className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-xgreen/[0.05]"
                        aria-pressed={!!done[k]}
                      >
                        {done[k] ? (
                          <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-xgreen" aria-hidden />
                        ) : (
                          <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                        )}
                        <span
                          className={cn(
                            "text-xs leading-relaxed",
                            done[k] ? "text-muted-foreground line-through" : "text-secondary-foreground",
                          )}
                        >
                          {item.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      {report.recommendations.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No remediation actions generated — exposure is minimal in the simulated corpus.
        </p>
      )}

      <p className="font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
        Recommendations are generated from finding categories, not from raw breach contents (§35).
        Future notifications (§56) — email, Telegram, Discord webhook — will always require
        explicit opt-in.
      </p>
    </div>
  );
}
