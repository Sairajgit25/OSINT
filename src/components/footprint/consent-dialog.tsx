// FootprintX — consent / authorization gate (§2 consent notice, §50 legal safeguard, §37 privacy)

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EyeOff, ShieldCheck, Scale, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskIdentifier } from "@/lib/scanner/hash";
import type { ScanConfig } from "@/lib/scanner/types";

const MODE_SCANNERS: Record<"quick" | "deep", string[]> = {
  quick: ["XposedOrNot — breach intelligence", "Holehe / Sherlock — account discovery", "Risk engine + report generator"],
  deep: [
    "XposedOrNot — breach intelligence",
    "Holehe / Sherlock — account discovery",
    "WhatsMyName — social cross-check",
    "Public web index — reference extraction",
    "Correlation + risk engine + report",
  ],
};

export function ConsentDialog({
  open,
  config,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  config: ScanConfig;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const mask = maskIdentifier(config.type, config.value);
  const privacy = config.retention === "after_scan";

  const handleConfirm = async () => {
    if (!authorized || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAuthorized(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setAuthorized(false); }}>
      <DialogContent className="max-w-md rounded-xl border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm tracking-[0.18em]">
            <Scale className="h-4 w-4 text-xgreen" aria-hidden />
            AUTHORIZATION &amp; PRIVACY
          </DialogTitle>
          <DialogDescription className="pt-1 text-xs leading-relaxed text-muted-foreground">
            Every scan passes a consent gate before any scanner is dispatched (§2). Review what will
            run and how results are handled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">TARGET</div>
            <div className="mt-1 font-mono text-sm text-xgreen">{mask}</div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {config.type.toUpperCase()} · {config.mode.toUpperCase()} SCAN ·{" "}
              {privacy ? "PRIVACY MODE" : "STORED PER RETENTION POLICY"}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-3">
            <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
              SCANNERS TO BE DISPATCHED
            </div>
            <ul className="space-y-1">
              {MODE_SCANNERS[config.mode].map((s) => (
                <li key={s} className="flex items-start gap-2 text-xs text-secondary-foreground">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-xgreen/80" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              "rounded-lg border p-3",
              privacy ? "border-xamber/40 bg-xamber/[0.06]" : "border-border bg-card/60",
            )}
          >
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-foreground">
              {privacy ? (
                <EyeOff className="h-3.5 w-3.5 text-xamber" aria-hidden />
              ) : (
                <Database className="h-3.5 w-3.5 text-xgreen/80" aria-hidden />
              )}
              {privacy ? "PRIVACY MODE ACTIVE" : "RESULT STORAGE"}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {privacy
                ? "Identifiers are never persisted. Raw search queries are not stored. Results are deleted automatically after the scan session. No analytics."
                : config.retention === "d30"
                  ? "The report is stored for 30 days, then automatically purged. The identifier is kept hashed and masked."
                  : "The report is stored until you delete it. The identifier is kept hashed and masked."}
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-xgreen/25 bg-xgreen/[0.05] p-3">
            <Checkbox
              checked={authorized}
              onCheckedChange={(v) => setAuthorized(v === true)}
              className="mt-0.5 border-xgreen/40 data-[state=checked]:bg-xgreen data-[state=checked]:text-primary-foreground"
              aria-label="Confirm authorization"
            />
            <span className="text-xs leading-relaxed text-secondary-foreground">
              I confirm this identifier is my own, or that I am explicitly authorized to assess it.
              I understand findings are presented with confidence levels, never as verified
              identity, and that no credentials are exposed.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-md font-mono text-[11px] tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!authorized || busy}
            className={cn(
              "rounded-md px-5 font-mono text-[11px] font-bold tracking-[0.14em]",
              privacy
                ? "bg-xamber text-black hover:bg-xamber/90"
                : "bg-xgreen text-primary-foreground hover:bg-xgreen/90",
            )}
          >
            <ShieldCheck className="mr-2 h-3.5 w-3.5" aria-hidden />
            AUTHORIZE &amp; START SCAN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
