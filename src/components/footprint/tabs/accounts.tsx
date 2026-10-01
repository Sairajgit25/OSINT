// FootprintX — Accounts tab: §32 account discovery + §19 Holehe presence

"use client";

import { useMemo, useState } from "react";
import { ExternalLink, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/scanner/types";
import { AvatarTile, ConfidenceBar, SourceTag, StatusBadge } from "../shared";

type Filter = "all" | "confirmed" | "likely" | "possible" | "not_found";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "confirmed", label: "CONFIRMED" },
  { value: "likely", label: "LIKELY" },
  { value: "possible", label: "POSSIBLE" },
  { value: "not_found", label: "NOT FOUND" },
];

export function AccountsTab({ report }: { report: Report }) {
  const [filter, setFilter] = useState<Filter>("all");
  const accounts = useMemo(
    () => (filter === "all" ? report.accounts : report.accounts.filter((a) => a.status === filter)),
    [report.accounts, filter],
  );
  const hasPresence = report.presence.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter accounts">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? report.accounts.length
              : report.accounts.filter((a) => a.status === f.value).length;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] transition",
                filter === f.value
                  ? "border-xgreen/45 bg-xgreen/10 text-xgreen"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Account cards (§32) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-lg border bg-card/70 p-4 transition hover:border-xgreen/25",
              a.status === "not_found" ? "border-border/60 opacity-60" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <AvatarTile label={a.platform} hue={a.profile?.avatar_hue ?? 150} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{a.platform}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {a.category} · @{a.username}
                  </div>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>

            {a.status !== "not_found" && (
              <>
                <div className="mt-3 flex items-center justify-between">
                  <ConfidenceBar value={a.confidence} />
                  <SourceTag source={a.source} />
                </div>
                <div className="mt-3 rounded-md border border-border/70 bg-background/50 p-2.5">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    <span className="truncate" title="Simulated result — outbound link disabled">
                      {a.url}
                    </span>
                  </div>
                  {a.profile && (
                    <div className="mt-2 space-y-1 font-mono text-[10px] leading-relaxed text-muted-foreground/85">
                      <div>joined {a.profile.joined} · {a.profile.followers.toLocaleString()} followers</div>
                      {a.profile.location && <div>location: {a.profile.location}</div>}
                      {a.profile.website && <div className="truncate">website: {a.profile.website}</div>}
                      <div className="text-secondary-foreground/70">{a.profile.bio}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No accounts in this confidence tier.
        </p>
      )}

      {/* Holehe presence (§19) — email scans */}
      {hasPresence && (
        <section aria-label="Email account presence">
          <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
            EMAIL → ACCOUNT PRESENCE · HOLEHE · §19
          </h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card/70">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-2 font-medium">SERVICE</th>
                  <th className="px-4 py-2 font-medium">SIGNAL</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">NOTE</th>
                  <th className="px-4 py-2 font-medium">CONFIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {report.presence.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 text-xs font-medium text-foreground">{p.platform}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em]",
                          p.status === "registered" && "text-xgreen",
                          p.status === "possible" && "text-xamber",
                          p.status === "not_registered" && "text-muted-foreground",
                          p.status === "unknown" && "text-muted-foreground",
                        )}
                      >
                        {p.status === "registered" && <CheckCircle2 className="h-3 w-3" aria-hidden />}
                        {p.status === "possible" && <HelpCircle className="h-3 w-3" aria-hidden />}
                        {p.status === "not_registered" && <XCircle className="h-3 w-3" aria-hidden />}
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">{p.note}</td>
                    <td className="px-4 py-2.5">
                      <ConfidenceBar value={p.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/70">
            Presence signals come from password-recovery flow probes only (§19). Recovery email or
            phone fragments are never treated as verified identity information.
          </p>
        </section>
      )}
    </div>
  );
}
