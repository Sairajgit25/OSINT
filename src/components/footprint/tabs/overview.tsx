// FootprintX — Overview tab: score recap, key findings, exposure charts

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Report } from "@/lib/scanner/types";
import { BandBadge, SeverityBadge, formatCount } from "../shared";

const KIND_LABELS: Record<string, string> = {
  repo: "Repositories",
  forum: "Forums",
  website: "Websites",
  document: "Documents",
  other: "Other",
};

const KIND_COLORS: Record<string, string> = {
  repo: "#34e28a",
  forum: "#2dd4bf",
  website: "#fbbf24",
  document: "#fb923c",
  other: "#7f9689",
};

export function OverviewTab({ report }: { report: Report }) {
  const mentionData = Object.entries(
    report.mentions.reduce<Record<string, number>>((acc, m) => {
      acc[m.kind] = (acc[m.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([kind, count]) => ({ kind: KIND_LABELS[kind] ?? kind, count, fill: KIND_COLORS[kind] }));

  const breachByYear = Object.entries(
    report.breaches.reduce<Record<string, number>>((acc, b) => {
      const y = b.breach_date.slice(0, 4);
      acc[y] = (acc[y] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const triggered = report.score.contributions.filter((c) => c.triggered && c.points > 0);
  const topBreaches = report.breaches.slice(0, 3);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Key risk drivers */}
      <Card className="border-border bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-xamber" aria-hidden />
            TOP RISK DRIVERS · §25
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {triggered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No exposure rules triggered — this identifier shows a minimal public footprint in the
              simulated corpus.
            </p>
          )}
          {triggered
            .sort((a, b) => b.points - a.points)
            .slice(0, 5)
            .map((c) => (
              <div
                key={c.rule}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">{c.label}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">{c.detail}</div>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-xamber">
                  +{c.points}
                </span>
              </div>
            ))}
          <div className="flex items-center justify-between rounded-md border border-xgreen/25 bg-xgreen/[0.05] px-3 py-2">
            <span className="font-mono text-[11px] tracking-wider text-xgreen">TOTAL (CAPPED AT 100)</span>
            <span className="font-mono text-sm font-bold tabular-nums text-xgreen">
              {report.score.score}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Breach digest */}
      <Card className="border-border bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-xred" aria-hidden />
            BREACH DIGEST · §31
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.breaches.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-xgreen/25 bg-xgreen/[0.05] p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-xgreen" aria-hidden />
              <p className="text-xs leading-relaxed text-secondary-foreground">
                No known breaches matched this identifier in the simulated corpus. Monitoring (§56)
                would notify you if that changes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topBreaches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{b.platform}</span>
                      <SeverityBadge severity={b.severity} />
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {b.breach_date} · {formatCount(b.pwn_count)} records · {b.data_types.length} data types
                    </div>
                  </div>
                  <BandBadge band={b.severity.toUpperCase()} />
                </div>
              ))}
              {report.breaches.length > 3 && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  + {report.breaches.length - 3} more in the Breaches tab
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mentions chart */}
      <Card className="border-border bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
            PUBLIC WEB REFERENCES BY CATEGORY · §33
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mentionData.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Public web scanning runs in deep mode only — run a deep scan to collect references.
            </p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mentionData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(228,239,232,0.07)" vertical={false} />
                  <XAxis
                    dataKey="kind"
                    tick={{ fill: "#7f9689", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={{ stroke: "rgba(228,239,232,0.12)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#7f9689", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(52,226,138,0.06)" }}
                    contentStyle={{
                      background: "#0c130f",
                      border: "1px solid rgba(201,218,205,0.15)",
                      borderRadius: 8,
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                      color: "#e4efe8",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {mentionData.map((d) => (
                      <Cell key={d.kind} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breach timeline */}
      <Card className="border-border bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
            BREACH TIMELINE BY YEAR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breachByYear.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No breaches matched.</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breachByYear} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(228,239,232,0.07)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#7f9689", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={{ stroke: "rgba(228,239,232,0.12)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#7f9689", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(248,113,113,0.06)" }}
                    contentStyle={{
                      background: "#0c130f",
                      border: "1px solid rgba(201,218,205,0.15)",
                      borderRadius: 8,
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                      color: "#e4efe8",
                    }}
                  />
                  <Bar dataKey="count" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
