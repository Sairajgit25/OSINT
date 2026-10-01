// FootprintX — Public Web tab (§22, §33)

"use client";

import { FileText, Globe, MessagesSquare, FolderGit2, MoreHorizontal } from "lucide-react";
import type { MentionKind, Report } from "@/lib/scanner/types";

const KIND_META: Record<MentionKind, { label: string; icon: typeof Globe; color: string }> = {
  repo: { label: "GitHub repositories", icon: FolderGit2, color: "text-xgreen" },
  forum: { label: "Forums", icon: MessagesSquare, color: "text-xteal" },
  website: { label: "Websites", icon: Globe, color: "text-xamber" },
  document: { label: "Documents", icon: FileText, color: "text-[#fb923c]" },
  other: { label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
};

export function PublicWebTab({ report }: { report: Report }) {
  if (report.mentions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/70 p-6 text-center">
        <Globe className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
        <h3 className="mt-3 font-mono text-sm font-semibold tracking-wider text-foreground">
          NO PUBLIC REFERENCES COLLECTED
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Public-web scanning (SearXNG, §22) runs during deep scans only. Run a deep scan to search
          the simulated index for exact-match references.
        </p>
      </div>
    );
  }

  const byKind = report.mentions.reduce<Record<string, typeof report.mentions>>((acc, m) => {
    (acc[m.kind] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold tabular-nums text-xamber fx-glow">
          {report.mentions.length}
        </span>
        <span className="font-mono text-xs text-muted-foreground">potential references</span>
        <span className="ml-auto font-mono text-[10px] tracking-wider text-muted-foreground/60">
          deduplicated by URL · exact-match queries only (§22)
        </span>
      </div>

      {(Object.keys(KIND_META) as MentionKind[]).map((kind) => {
        const items = byKind[kind];
        if (!items || items.length === 0) return null;
        const meta = KIND_META[kind];
        return (
          <section key={kind} aria-label={meta.label}>
            <h3 className="mb-2.5 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
              <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} aria-hidden />
              {meta.label.toUpperCase()}
              <span className="tabular-nums text-muted-foreground/60">{items.length}</span>
            </h3>
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card/70 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-semibold leading-snug text-foreground">{m.title}</h4>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {m.date}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] text-xteal/70" title="Simulated reference — outbound link disabled">
                    {m.url}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.snippet}</p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
