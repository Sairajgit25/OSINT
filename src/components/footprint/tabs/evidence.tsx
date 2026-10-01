// FootprintX — Evidence tab (§5 explainability, §43 source attribution)

"use client";

import { Info } from "lucide-react";
import type { Report } from "@/lib/scanner/types";

const PRINCIPLES = [
  ["WHAT?", "The finding type and affected platform or service."],
  ["WHERE?", "The source and source URL that produced the evidence."],
  ["WHEN?", "Retrieval timestamp and, for breaches, the incident date."],
  ["HOW WAS IT FOUND?", "The scanner and probe method that produced the signal."],
  ["HOW CONFIDENT?", "An explicit confidence level — never conflated with confirmation (§26)."],
  ["WHAT SHOULD I DO?", "A remediation action tied to the finding category (§35)."],
];

export function EvidenceTab({ report }: { report: Report }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-lg border border-xgreen/20 bg-xgreen/[0.04] p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-xgreen" aria-hidden />
        <div>
          <p className="text-xs font-semibold text-foreground">
            Every finding answers six questions (§5).
          </p>
          <div className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {PRINCIPLES.map(([q, a]) => (
              <div key={q} className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-mono font-semibold text-xgreen/80">{q}</span> {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <div className="border-b border-border/70 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
          SOURCE ATTRIBUTION REGISTER · §43
        </div>
        <div className="overflow-x-auto fx-scroll">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-2 font-medium">FINDING</th>
                <th className="px-4 py-2 font-medium">SOURCE</th>
                <th className="px-4 py-2 font-medium">PROBE / SOURCE URL</th>
                <th className="px-4 py-2 font-medium">RETRIEVED</th>
                <th className="px-4 py-2 font-medium">SCANNER VER.</th>
              </tr>
            </thead>
            <tbody>
              {report.evidence.map((e) => (
                <tr key={e.id} className="border-b border-border/30 align-top last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-medium text-foreground">{e.finding_label}</div>
                    <div className="mt-0.5 max-w-xs text-[11px] leading-snug text-muted-foreground">{e.note}</div>
                    <div className="mt-0.5 font-mono text-[9px] text-muted-foreground/50">{e.finding_ref}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-xgreen/85">{e.source}</td>
                  <td className="max-w-[280px] px-4 py-2.5">
                    <div className="truncate font-mono text-[10px] text-xteal/70" title="Simulated source — link disabled">
                      {e.source_url}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {new Date(e.retrieved_at).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                    {e.scanner_version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
        Attribution is mandatory when combining multiple providers: HIBP-derived breach data
        requires visible attribution under its license (§43). Provider adapters isolate
        licensing and rate-limit differences (§57).
      </p>
    </div>
  );
}
