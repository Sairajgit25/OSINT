// FootprintX — Risk tab (§25): itemized score contributions + band scale

"use client";

import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/scanner/types";
import { ScoreGauge } from "../score-gauge";

const BANDS: { label: string; range: string; color: string }[] = [
  { label: "LOW", range: "0–20", color: "#34e28a" },
  { label: "MODERATE", range: "21–40", color: "#2dd4bf" },
  { label: "ELEVATED", range: "41–60", color: "#fbbf24" },
  { label: "HIGH", range: "61–80", color: "#fb923c" },
  { label: "CRITICAL", range: "81–100", color: "#f87171" },
];

export function RiskTab({ report }: { report: Report }) {
  const { score } = report;
  const activeIndex = BANDS.findIndex((b) => b.label === score.band);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/70 p-5">
          <ScoreGauge score={score.score} band={score.band} />
          <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-muted-foreground/80">
            {score.capped ? "Raw sum exceeded 100 — capped (§25)." : "Raw weighted sum of triggered rules."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/70 p-4 sm:p-5">
          <h3 className="font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
            SEVERITY BANDS · §25
          </h3>
          <div className="mt-3 space-y-1.5">
            {BANDS.map((b, i) => (
              <div
                key={b.label}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 transition",
                  i === activeIndex ? "border-xgreen/40 bg-xgreen/[0.06]" : "border-border/60 bg-background/40",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm" style={{ background: b.color }} aria-hidden />
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold tracking-[0.14em]",
                      i === activeIndex ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {b.label}
                  </span>
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{b.range}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-xamber/25 bg-xamber/[0.05] p-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-xamber" aria-hidden />
            <p className="text-[11px] leading-relaxed text-muted-foreground">{score.disclaimer}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <div className="border-b border-border/70 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
          SCORE CONTRIBUTIONS · ITEMIZED
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-2 font-medium">RULE</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">DETAIL</th>
              <th className="px-4 py-2 text-right font-medium">POINTS</th>
              <th className="px-4 py-2 text-center font-medium">TRIGGERED</th>
            </tr>
          </thead>
          <tbody>
            {score.contributions.map((c) => (
              <tr
                key={c.rule}
                className={cn("border-b border-border/30 last:border-0", c.triggered && c.points > 0 && "bg-xamber/[0.03]")}
              >
                <td className="px-4 py-2.5">
                  <div className="text-xs font-medium text-foreground">{c.label}</div>
                  <div className="font-mono text-[9px] text-muted-foreground/60">{c.rule}</div>
                </td>
                <td className="hidden max-w-md px-4 py-2.5 text-[11px] leading-snug text-muted-foreground md:table-cell">
                  {c.detail}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  +{c.points}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {c.triggered ? (
                    <Check className="mx-auto h-4 w-4 text-xgreen" aria-label="triggered" />
                  ) : (
                    <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="not triggered" />
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-t border-xgreen/30 bg-xgreen/[0.05]">
              <td className="px-4 py-3 font-mono text-[11px] font-bold tracking-[0.14em] text-xgreen" colSpan={2}>
                EXPOSURE SCORE (CAPPED AT 100)
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold tabular-nums text-xgreen" colSpan={2}>
                {score.score}/100 · {score.band}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
