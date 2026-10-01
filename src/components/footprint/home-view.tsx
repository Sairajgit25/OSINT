// FootprintX — home screen: hero, scan form, pipeline (§2), principles, recent scans

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  User,
  Phone,
  Globe,
  Lock,
  Radar,
  Search,
  Zap,
  Database,
  Share2,
  GitBranch,
  Gauge,
  FileText,
  ChevronRight,
  ShieldCheck,
  EyeOff,
  Scale,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConsentDialog } from "./consent-dialog";
import { BandBadge } from "./shared";
import { validateIdentifier } from "@/lib/scanner/hash";
import type { ScanConfig, ScanMode, Retention } from "@/lib/scanner/types";
import { useToast } from "@/hooks/use-toast";

interface RecentScan {
  id: string;
  identifier_mask: string;
  identifier_type: string;
  mode: string;
  risk_score: number | null;
  severity_band: string | null;
  status: string;
  created_at: string;
  privacy: boolean;
  retention: string;
}

const TYPE_OPTIONS = [
  { value: "email" as const, label: "EMAIL", icon: AtSign, locked: false },
  { value: "username" as const, label: "USERNAME", icon: User, locked: false },
  { value: "phone" as const, label: "PHONE", icon: Phone, locked: true },
  { value: "domain" as const, label: "DOMAIN", icon: Globe, locked: true },
];

const MODE_OPTIONS: {
  value: ScanMode;
  label: string;
  desc: string;
  icon: typeof Zap;
}[] = [
  {
    value: "quick",
    label: "QUICK SCAN",
    desc: "Breach intelligence + basic account discovery. ≈ 5 seconds.",
    icon: Zap,
  },
  {
    value: "deep",
    label: "DEEP SCAN",
    desc: "Adds social cross-check, public web index and identity correlation. ≈ 9 seconds.",
    icon: Radar,
  },
];

const RETENTION_OPTIONS: {
  value: Retention;
  label: string;
  desc: string;
}[] = [
  { value: "d30", label: "SAVE 30 DAYS", desc: "Report stored, identifier hashed + masked" },
  { value: "until_deleted", label: "UNTIL DELETED", desc: "Report stored until you remove it" },
  { value: "after_scan", label: "DELETE AFTER SCAN", desc: "Privacy Mode — nothing is persisted" },
];

const PIPELINE = [
  { icon: AtSign, label: "Identifier" },
  { icon: Scale, label: "Consent gate" },
  { icon: Radar, label: "OSINT scanners" },
  { icon: Database, label: "Normalization" },
  { icon: GitBranch, label: "Correlation" },
  { icon: Gauge, label: "Confidence" },
  { icon: ShieldCheck, label: "Risk analysis" },
  { icon: FileText, label: "Report" },
];

const PRINCIPLES = [
  {
    icon: EyeOff,
    title: "Privacy by default",
    body: "Privacy Mode never persists identifiers or raw queries, auto-deletes results and runs zero analytics (§37). Local-only deployment keeps everything on your machine (§38).",
  },
  {
    icon: Scale,
    title: "Found ≠ confirmed",
    body: "Every finding carries an explicit confidence level — CONFIRMED, LIKELY, POSSIBLE — with evidence, so a username match is never mistaken for verified identity (§26).",
  },
  {
    icon: ShieldCheck,
    title: "Defensive, never offensive",
    body: "No password recovery attacks, no auth or CAPTCHA bypass, no scraping of private data, no deanonymization. Consent is built into the workflow (§4, §50).",
  },
];

export function HomeView({
  onStart,
  submitting,
  historyKey,
}: {
  onStart: (cfg: ScanConfig) => Promise<void>;
  submitting: boolean;
  historyKey: number;
}) {
  const [type, setType] = useState<"email" | "username">("email");
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<ScanMode>("deep");
  const [retention, setRetention] = useState<Retention>("d30");
  const [error, setError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/scans")
      .then((r) => r.json())
      .then((body: { scans: RecentScan[] }) => {
        if (!cancelled) setRecent(body.scans ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [historyKey]);

  const privacy = retention === "after_scan";

  const attemptStart = () => {
    const check = validateIdentifier(type, value);
    if (!check.valid) {
      setError(check.reason ?? "Invalid identifier.");
      return;
    }
    setError(null);
    setConsentOpen(true);
  };

  const confirmedConfig: ScanConfig = useMemo(
    () => ({ type, value: value.trim(), mode, privacy, retention }),
    [type, value, mode, privacy, retention],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      {/* Hero */}
      <section className="pt-14 pb-10 text-center sm:pt-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-xgreen/25 bg-xgreen/5 px-3 py-1 font-mono text-[10px] tracking-[0.28em] text-xgreen/90">
          <span className="relative flex h-1.5 w-1.5">
            <span className="fx-ping absolute h-1.5 w-1.5 rounded-full bg-xgreen" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-xgreen" />
          </span>
          OPEN-SOURCE · PRIVACY-FIRST · SELF-ASSESSMENT
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
          What does the internet
          <br />
          <span className="text-xgreen fx-glow">already know</span> about you?
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          FootprintX turns scattered OSINT signals — known breaches, account registrations, public
          references — into one evidence-backed Digital Exposure Report. Scan yourself. Understand
          your exposure. Fix it.
        </p>
      </section>

      {/* Scan form */}
      <section className="mx-auto max-w-3xl" aria-label="Start a scan">
        <div className="fx-glow-box rounded-xl border border-xgreen/25 bg-card/90 p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Identifier type">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={type === opt.value}
                disabled={opt.locked}
                onClick={() => setType(opt.value as "email" | "username")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] transition",
                  opt.locked
                    ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground/50"
                    : type === opt.value
                      ? "border-xgreen/50 bg-xgreen/10 text-xgreen"
                      : "border-border bg-card text-muted-foreground hover:border-xgreen/30 hover:text-foreground",
                )}
                title={opt.locked ? "Planned for a later phase" : undefined}
              >
                <opt.icon className="h-3.5 w-3.5" aria-hidden />
                {opt.label}
                {opt.locked && <Lock className="h-2.5 w-2.5" aria-hidden />}
              </button>
            ))}
            <span className="ml-auto hidden font-mono text-[10px] tracking-wider text-muted-foreground/70 sm:inline">
              {type === "email" ? "MVP §6 G1/G3" : "MVP §6 G2"}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") attemptStart();
              }}
              placeholder={
                type === "email" ? "you@example.com" : "your-public-username"
              }
              inputMode={type === "email" ? "email" : "text"}
              aria-label={type === "email" ? "Email address to scan" : "Username to scan"}
              className="h-12 flex-1 rounded-md border-border bg-background/80 font-mono text-sm placeholder:text-muted-foreground/50 focus-visible:ring-xgreen/40"
            />
            <Button
              onClick={attemptStart}
              disabled={submitting}
              className="h-12 rounded-md bg-xgreen px-6 font-mono text-xs font-bold tracking-[0.18em] text-primary-foreground transition hover:bg-xgreen/90 disabled:opacity-60 sm:px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  DISPATCHING
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" aria-hidden />
                  START SCAN
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="mt-2 font-mono text-xs text-xred" role="alert">
              {error}
            </p>
          )}

          {/* Scan mode */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Scan mode">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={mode === opt.value}
                onClick={() => setMode(opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  mode === opt.value
                    ? "border-xgreen/45 bg-xgreen/[0.07]"
                    : "border-border bg-background/40 hover:border-xgreen/25",
                )}
              >
                <div className="flex items-center gap-2">
                  <opt.icon
                    className={cn("h-4 w-4", mode === opt.value ? "text-xgreen" : "text-muted-foreground")}
                    aria-hidden
                  />
                  <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-foreground">
                    {opt.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Retention / privacy mode (§37) */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.24em] text-muted-foreground">
              RESULT RETENTION · §37
            </div>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Result retention">
              {RETENTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={retention === opt.value}
                  onClick={() => setRetention(opt.value)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition",
                    retention === opt.value
                      ? opt.value === "after_scan"
                        ? "border-xamber/50 bg-xamber/[0.07]"
                        : "border-xgreen/45 bg-xgreen/[0.07]"
                      : "border-border bg-background/40 hover:border-xgreen/25",
                  )}
                >
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-foreground">
                    {opt.value === "after_scan" && <EyeOff className="h-3 w-3 text-xamber" aria-hidden />}
                    {opt.label}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 border-t border-border/60 pt-3 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground/80">
            By starting a scan you confirm the identifier is yours or you are explicitly authorized
            to assess it (§50). Simulated build: findings are synthesized deterministically from
            your input — no external requests are made.
          </p>
        </div>
      </section>

      {/* Pipeline (§2) */}
      <section className="mt-14" aria-label="How it works">
        <div className="mb-5 text-center">
          <div className="font-mono text-[10px] font-semibold tracking-[0.3em] text-xgreen/80">
            HOW IT WORKS · §2
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Eight deterministic stages, one report
          </h2>
        </div>
        <ol className="flex flex-wrap items-center justify-center gap-y-3">
          {PIPELINE.map((step, i) => (
            <li key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-2.5 sm:px-4">
                <step.icon className="h-4 w-4 text-xgreen/90" aria-hidden />
                <span className="font-mono text-[9px] tracking-[0.12em] text-secondary-foreground sm:text-[10px]">
                  {step.label.toUpperCase()}
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <ChevronRight className="mx-1 h-3.5 w-3.5 text-xgreen/40 sm:mx-2" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Principles */}
      <section className="mt-14" aria-label="Principles">
        <div className="grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-lg border border-border bg-card/60 p-5">
              <p.icon className="h-5 w-5 text-xgreen" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent scans */}
      {recent.length > 0 && (
        <section className="mt-14" aria-label="Recent scans">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="font-mono text-[11px] font-semibold tracking-[0.24em] text-muted-foreground">
              RECENT SCANS
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">IDENTIFIER</th>
                  <th className="px-4 py-2.5 font-medium">MODE</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">STATUS</th>
                  <th className="px-4 py-2.5 font-medium">EXPOSURE</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">CREATED</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                      {s.identifier_mask}
                      {s.privacy && (
                        <span className="ml-2 rounded-sm border border-xamber/40 bg-xamber/10 px-1 py-0.5 align-middle font-mono text-[9px] tracking-wide text-xamber">
                          PRIVACY
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.mode}
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          s.status === "completed" ? "text-xgreen" : "text-xamber",
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {s.risk_score != null ? (
                        <span className="inline-flex items-center gap-2 font-mono text-xs">
                          <span className="tabular-nums text-foreground">{s.risk_score}/100</span>
                          {s.severity_band && <BandBadge band={s.severity_band} />}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 font-mono text-[10px] text-muted-foreground md:table-cell">
                      {new Date(s.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConsentDialog
        open={consentOpen}
        config={confirmedConfig}
        onOpenChange={setConsentOpen}
        onConfirm={async () => {
          setConsentOpen(false);
          try {
            await onStart(confirmedConfig);
          } catch (err) {
            toast({
              title: "Scan failed",
              description: err instanceof Error ? err.message : "Unexpected error.",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
