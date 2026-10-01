// FootprintX — shared UI atoms (badges, confidence bars, avatar tiles)

import { cn } from "@/lib/utils";
import type { MatchStatus, Severity } from "@/lib/scanner/types";

/** §26 — never conflate "found" with "confirmed" */
export const STATUS_LABELS: Record<MatchStatus, string> = {
  confirmed: "CONFIRMED",
  likely: "LIKELY",
  possible: "POSSIBLE",
  not_found: "NOT FOUND",
  unknown: "UNKNOWN",
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  const styles: Record<MatchStatus, string> = {
    confirmed: "border-xgreen/40 bg-xgreen/10 text-xgreen",
    likely: "border-xteal/40 bg-xteal/10 text-xteal",
    possible: "border-xamber/40 bg-xamber/10 text-xamber",
    not_found: "border-border bg-muted text-muted-foreground",
    unknown: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em]",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "confirmed" && "bg-xgreen",
          status === "likely" && "bg-xteal",
          status === "possible" && "bg-xamber",
          (status === "not_found" || status === "unknown") && "bg-muted-foreground",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "moderate", "low"];

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    critical: "border-xred/40 bg-xred/10 text-xred",
    high: "border-xred/30 bg-xred/5 text-xred/90",
    moderate: "border-xamber/40 bg-xamber/10 text-xamber",
    low: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase",
        styles[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function BandBadge({ band }: { band: string }) {
  const map: Record<string, string> = {
    LOW: "border-xgreen/40 bg-xgreen/10 text-xgreen",
    MODERATE: "border-xteal/40 bg-xteal/10 text-xteal",
    ELEVATED: "border-xamber/40 bg-xamber/10 text-xamber",
    HIGH: "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]",
    CRITICAL: "border-xred/40 bg-xred/10 text-xred",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em]",
        map[band] ?? "border-border bg-muted text-muted-foreground",
      )}
    >
      {band}
    </span>
  );
}

export function ConfidenceBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.8 ? "bg-xgreen" : value >= 0.6 ? "bg-xteal" : value > 0 ? "bg-xamber" : "bg-muted-foreground/40";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-foreground/10">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function AvatarTile({
  label,
  hue = 150,
  size = "md",
}: {
  label: string;
  hue?: number;
  size?: "sm" | "md";
}) {
  const initial = (label || "?").slice(0, 1).toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border font-mono font-bold",
        size === "md" ? "h-10 w-10 text-base" : "h-7 w-7 text-xs",
      )}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 45% 16%), hsl(${hue} 40% 9%))`,
        borderColor: `hsl(${hue} 45% 26%)`,
        color: `hsl(${hue} 70% 65%)`,
      }}
    >
      {initial}
    </div>
  );
}

export function SourceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground">
      {source}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", className)} />;
}

export function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      {kicker && (
        <div className="mb-1 font-mono text-[10px] font-semibold tracking-[0.3em] text-xgreen/80 uppercase">
          {kicker}
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
