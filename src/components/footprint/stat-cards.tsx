// FootprintX — summary stat cards (§30) with count-up

"use client";

import { useEffect, useRef, useState } from "react";
import { Database, Users, Globe, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportSummary } from "@/lib/scanner/types";

function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  sub: string;
  tone: "green" | "teal" | "amber" | "red";
}) {
  const n = useCountUp(value);
  const tones = {
    green: "text-xgreen border-xgreen/25 bg-xgreen/[0.05]",
    teal: "text-xteal border-xteal/25 bg-xteal/[0.05]",
    amber: "text-xamber border-xamber/25 bg-xamber/[0.05]",
    red: "text-xred border-xred/25 bg-xred/[0.05]",
  };
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md border", tones[tone])}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 font-mono text-3xl font-bold tabular-nums text-foreground">{n}</div>
      <div className="mt-1 font-mono text-[10px] leading-snug tracking-wide text-muted-foreground/80">
        {sub}
      </div>
    </div>
  );
}

export function StatCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Database}
        label="BREACHES"
        value={summary.breaches}
        sub={
          summary.earliest_breach
            ? `earliest ${summary.earliest_breach.slice(0, 4)}`
            : "no records matched"
        }
        tone={summary.breaches > 0 ? "red" : "green"}
      />
      <StatCard
        icon={Users}
        label="ACCOUNTS"
        value={summary.accounts}
        sub={`across ${summary.platforms} platforms`}
        tone="teal"
      />
      <StatCard
        icon={Globe}
        label="MENTIONS"
        value={summary.mentions}
        sub={summary.mentions > 0 ? "public web references" : "deep scan only"}
        tone="amber"
      />
      <StatCard
        icon={ShieldAlert}
        label="RISKS"
        value={summary.risks}
        sub="risk rules triggered"
        tone="red"
      />
    </div>
  );
}
