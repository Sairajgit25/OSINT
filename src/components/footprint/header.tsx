// FootprintX — app header with scanner health (§45) + simulation badge

"use client";

import { Footprints, Activity, ShieldCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SCANNER_HEALTH } from "@/lib/scanner/catalog";
import { cn } from "@/lib/utils";

function HealthDot({ status }: { status: string }) {
  if (status === "operational") {
    return (
      <span className="relative inline-flex h-2 w-2">
        <span className="fx-ping absolute inline-flex h-2 w-2 rounded-full bg-xgreen" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-xgreen" />
      </span>
    );
  }
  if (status === "not-configured") return <span className="inline-block h-2 w-2 rounded-full bg-xamber" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50" />;
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-xgreen/30 bg-xgreen/10">
            <Footprints className="h-4 w-4 text-xgreen" aria-hidden />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-sm font-bold tracking-[0.28em] text-foreground">
              FOOTPRINT<span className="text-xgreen fx-glow">X</span>
            </div>
            <div className="hidden font-mono text-[9px] tracking-[0.22em] text-muted-foreground sm:block">
              DIGITAL EXPOSURE SCANNER
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-sm border border-xamber/40 bg-xamber/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-xamber md:inline-flex"
            title="This build runs a deterministic offline simulation — no external requests are made and no real accounts are queried."
          >
            <ShieldCheck className="h-3 w-3" aria-hidden />
            SIMULATION MODE
          </span>

          <Popover>
            <PopoverTrigger
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 font-mono text-[11px] text-secondary-foreground transition hover:border-xgreen/40 hover:text-foreground"
              aria-label="Scanner health"
            >
              <Activity className="h-3.5 w-3.5 text-xgreen" aria-hidden />
              <span className="hidden sm:inline">SCANNERS</span>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 rounded-lg border-border bg-popover p-3"
            >
              <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.24em] text-muted-foreground">
                SCANNER HEALTH · §45
              </div>
              <ul className="space-y-2">
                {SCANNER_HEALTH.map((s) => (
                  <li key={s.name} className="flex items-start gap-2.5">
                    <span className="mt-1.5">
                      <HealthDot status={s.status} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <span
                          className={cn(
                            "font-mono text-[9px] tracking-[0.14em] uppercase",
                            s.status === "operational" && "text-xgreen",
                            s.status === "not-configured" && "text-xamber",
                            s.status === "phase-2" && "text-muted-foreground",
                          )}
                        >
                          {s.status === "operational"
                            ? "operational"
                            : s.status === "not-configured"
                              ? "not configured"
                              : "phase 2"}
                        </span>
                      </div>
                      <div className="text-xs leading-snug text-muted-foreground">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
