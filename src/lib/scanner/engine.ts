// FootprintX — simulation engine.
// Deterministic, offline synthesis of OSINT-style findings from an identifier.
// Same identifier → same report, always. No external requests are made.

import {
  BREACH_CATALOG,
  MENTION_TEMPLATES,
  PLATFORM_CATALOG,
  PRESENCE_CATALOG,
  SCANNER_VERSIONS,
} from "./catalog";
import { fnv1a, isoAt, maskIdentifier, rngFrom, sha256 } from "./hash";
import { buildRecommendations } from "./recommendations";
import { computeRisk } from "./scoring";
import type {
  AccountFinding,
  BreachFinding,
  Correlation,
  Evidence,
  EvidenceRow,
  MentionFinding,
  PresenceFinding,
  Report,
  ReportGraph,
  ScanConfig,
} from "./types";

function evidenceFor(
  source: string,
  sourceUrl: string,
  createdAt: number,
  offset: number,
): Evidence {
  return {
    source,
    source_url: sourceUrl,
    retrieved_at: isoAt(createdAt, offset),
    scanner_version: SCANNER_VERSIONS[source] ?? "1.0.0",
  };
}

const BIOS = [
  "Building things for the web. Occasional open-source contributor.",
  "Software engineer · coffee-dependent · posts about tooling.",
  "Photographer and travel enthusiast. Docs & snapshots below.",
  "Just here for the memes and the occasional hot take.",
  "DevOps by day, mechanical keyboards by night.",
  "Interested in privacy tech, security research and hiking.",
];
const LOCATIONS = ["Berlin, DE", "Austin, TX", "Lisbon, PT", "Toronto, CA", "Bengaluru, IN", "Amsterdam, NL"];

export function generateReport(
  scanId: string,
  config: ScanConfig,
  createdAt: number,
): Report {
  const normalized = config.value.trim().toLowerCase();
  const seed = fnv1a(`${config.type}:${normalized}`);
  const rng = rngFrom(seed);
  const hash = sha256(normalized);
  const mask = maskIdentifier(config.type, normalized);
  const deep = config.mode === "deep";
  const handle =
    config.type === "username" ? normalized : normalized.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") || "user";

  // ── Breach findings (XposedOrNot, §17) ─────────────────────────────────
  const breachCount = config.type === "email" ? rng.int(3, 6) : rng.int(2, 4);
  const breachSet = rng.shuffle(BREACH_CATALOG).slice(0, breachCount);
  const breaches: BreachFinding[] = breachSet
    .map((b, i) => ({
      id: `fnd_breach_${i + 1}`,
      type: "breach" as const,
      target_type: config.type,
      source: "xposedornot" as const,
      platform: b.name,
      domain: b.domain,
      breach_date: b.date,
      pwn_count: b.pwn_count,
      data_types: b.dataTypes,
      severity: b.severity,
      verified: b.verified,
      matched_by:
        config.type === "email"
          ? "email address matched in breach corpus"
          : "username matched in aggregated credential lists",
      evidence: evidenceFor(
        "xposedornot",
        config.type === "email"
          ? `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(mask)}`
          : `https://api.xposedornot.com/v1/breaches — username match in aggregated credential corpus (${encodeURIComponent(mask)})`,
        createdAt,
        1400 + i * 120,
      ),
    }))
    .sort((a, b) => (a.breach_date < b.breach_date ? 1 : -1));

  // ── Username accounts (Sherlock §20 + WhatsMyName §21) ─────────────────
  const accounts: AccountFinding[] = PLATFORM_CATALOG.map((p, i) => {
    const roll = rng.next();
    let status: AccountFinding["status"];
    let confidence: number;
    if (roll < 0.34) {
      status = "confirmed";
      confidence = rng.int(86, 97) / 100;
    } else if (roll < 0.55) {
      status = "likely";
      confidence = rng.int(70, 85) / 100;
    } else if (roll < 0.75) {
      status = "possible";
      confidence = rng.int(40, 66) / 100;
    } else {
      status = "not_found";
      confidence = 0;
    }
    const hasProfile = status === "confirmed" || status === "likely";
    const hasWebsite = hasProfile && rng.bool(0.45);
    return {
      id: `fnd_acct_${i + 1}`,
      type: "social_account" as const,
      target_type: config.type,
      source: p.source,
      platform: p.platform,
      username: handle,
      url: p.urlTemplate(handle),
      status,
      confidence,
      category: p.category,
      profile: hasProfile
        ? {
            bio: rng.pick(BIOS),
            joined: `${rng.int(2011, 2023)}-${String(rng.int(1, 12)).padStart(2, "0")}`,
            followers: rng.int(12, 4200),
            website: hasWebsite ? `https://${handle}.example.dev` : null,
            location: rng.bool(0.5) ? rng.pick(LOCATIONS) : null,
            avatar_hue: p.hue,
          }
        : null,
      evidence: evidenceFor(
        String(p.source),
        p.platform === "GitHub"
          ? `https://api.github.com/users/${handle} (profile probe)`
          : `${p.urlTemplate(handle)} (existence check)`,
        createdAt,
        2200 + i * 95,
      ),
    };
  });

  // ── Email presence signals (Holehe §19) ────────────────────────────────
  const presence: PresenceFinding[] =
    config.type === "email"
      ? PRESENCE_CATALOG.map((svc, i) => {
          const roll = rng.next();
          let status: PresenceFinding["status"];
          let confidence: number;
          if (roll < 0.4) {
            status = "registered";
            confidence = rng.int(72, 90) / 100;
          } else if (roll < 0.62) {
            status = "possible";
            confidence = rng.int(45, 70) / 100;
          } else if (roll < 0.92) {
            status = "not_registered";
            confidence = 0.95;
          } else {
            status = "unknown";
            confidence = 0.2;
          }
          return {
            id: `fnd_pres_${i + 1}`,
            type: "account_presence" as const,
            target_type: config.type,
            source: "holehe" as const,
            platform: svc.platform,
            status,
            confidence,
            note:
              status === "registered" || status === "possible"
                ? svc.noteFound
                : status === "not_registered"
                  ? svc.noteMissing
                  : "Recovery flow unreachable — inconclusive",
            evidence: evidenceFor(
              "holehe",
              `${svc.platform.toLowerCase().replace(/[^a-z]/g, "")}.com — password recovery flow probe`,
              createdAt,
              1900 + i * 110,
            ),
          };
        })
      : [];

  // ── Public web mentions (§22, deep scan only) ─────────────────────────
  const counts = { repo: rng.int(6, 9), forum: rng.int(4, 7), website: rng.int(3, 6), document: rng.int(3, 5), other: rng.int(3, 6) };
  const mentions: MentionFinding[] = [];
  if (deep) {
    let idx = 0;
    (Object.entries(counts) as [keyof typeof counts, number][]).forEach(([kind, n]) => {
      const templates = MENTION_TEMPLATES.filter((t) => t.kind === kind);
      for (let k = 0; k < n; k++) {
        const tpl = templates[k % templates.length];
        idx += 1;
        mentions.push({
          id: `fnd_web_${idx}`,
          type: "public_reference" as const,
          target_type: config.type,
          source: "searxng" as const,
          title: tpl.title(handle),
          url: tpl.url(`${handle}${k > 0 ? `-${k}` : ""}`),
          kind,
          date: `${rng.int(2016, 2025)}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`,
          snippet: tpl.snippet(handle),
          evidence: evidenceFor("searxng", `searxng local instance — query "${mask}" (exact-match)`, createdAt, 5200 + idx * 60),
        });
      }
    });
    mentions.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  // ── Identity correlation (§27) ─────────────────────────────────────────
  const strongAccounts = accounts.filter((a) => a.status === "confirmed" || a.status === "likely").slice(0, 6);
  const correlations: Correlation[] = [];
  for (let i = 0; i + 1 < strongAccounts.length; i += 2) {
    const a = strongAccounts[i];
    const b = strongAccounts[i + 1];
    if (!a || !b) continue;
    const sharedWebsite = !!a.profile?.website && a.profile?.website === b.profile?.website;
    const sharedAvatar = rng.bool(0.6);
    const sharedBio = rng.bool(0.45);
    const signals = [
      { label: "Identical username", matched: true },
      { label: "Same external website link", matched: sharedWebsite },
      { label: "Same public avatar", matched: sharedAvatar },
      { label: "Overlapping bio keywords", matched: sharedBio },
    ];
    const matched = signals.filter((s) => s.matched).length;
    const confidence = Math.min(0.97, 0.28 + matched * 0.17 + rng.int(0, 4) / 100);
    correlations.push({
      id: `corr_${i / 2 + 1}`,
      pair: [a.platform, b.platform],
      confidence,
      verdict:
        confidence >= 0.8
          ? "Strong correlation — accounts very likely belong to the same person. Not verified identity."
          : confidence >= 0.55
            ? "Moderate correlation — consistent with the same person, but unverified."
            : "Weak correlation — a shared username alone is not evidence of shared ownership.",
      signals,
    });
  }

  // ── Risk engine (§25) ──────────────────────────────────────────────────
  const score = computeRisk({ identifierType: config.type, breaches, accounts, presence, mentions });
  const recommendations = buildRecommendations(breaches, mentions, score.score);

  // ── Graph (§34) ────────────────────────────────────────────────────────
  const graph = buildGraph(config, mask, breaches, accounts, presence, correlations);

  // ── Evidence register (§43) ────────────────────────────────────────────
  const evidence: EvidenceRow[] = [
    ...breaches.slice(0, 4).map((b) => ({
      id: `ev_${b.id}`,
      source: b.evidence.source,
      source_url: b.evidence.source_url,
      retrieved_at: b.evidence.retrieved_at,
      scanner_version: b.evidence.scanner_version,
      finding_ref: b.id,
      finding_label: `Breach · ${b.platform}`,
      note: `${b.matched_by}. Data classes: ${b.data_types.slice(0, 3).join(", ")}.`,
    })),
    ...accounts
      .filter((a) => a.status !== "not_found")
      .slice(0, 6)
      .map((a) => ({
        id: `ev_${a.id}`,
        source: a.evidence.source,
        source_url: a.evidence.source_url,
        retrieved_at: a.evidence.retrieved_at,
        scanner_version: a.evidence.scanner_version,
        finding_ref: a.id,
        finding_label: `Account · ${a.platform}`,
        note: `Existence check returned ${a.status === "confirmed" ? "a live profile" : a.status === "likely" ? "a probable profile" : "an ambiguous response"} · confidence ${(a.confidence * 100).toFixed(0)}%.`,
      })),
    ...mentions.slice(0, 4).map((m) => ({
      id: `ev_${m.id}`,
      source: m.evidence.source,
      source_url: m.evidence.source_url,
      retrieved_at: m.evidence.retrieved_at,
      scanner_version: m.evidence.scanner_version,
      finding_ref: m.id,
      finding_label: `Reference · ${m.kind}`,
      note: `Exact-match query surfaced a ${m.kind} reference dated ${m.date}.`,
    })),
  ];

  const accountCount = accounts.filter((a) => a.status !== "not_found").length + presence.filter((p) => p.status === "registered" || p.status === "possible").length;

  return {
    scan_id: scanId,
    identifier: { type: config.type, mask, hash, value: null },
    mode: config.mode,
    privacy: config.privacy,
    generated_at: isoAt(createdAt, 0),
    scanner_versions: SCANNER_VERSIONS,
    summary: {
      breaches: breaches.length,
      accounts: accountCount,
      mentions: mentions.length,
      risks: score.contributions.filter((c) => c.triggered && c.points > 0).length,
      presence: presence.filter((p) => p.status === "registered").length,
      earliest_breach: breaches.length ? breaches[breaches.length - 1].breach_date : null,
      platforms: new Set([...accounts.map((a) => a.platform), ...presence.map((p) => p.platform)]).size,
    },
    score,
    breaches,
    accounts,
    presence,
    mentions,
    correlations,
    recommendations,
    evidence,
    graph,
  };
}

// ── Identity graph layout (§34) ───────────────────────────────────────────
function buildGraph(
  config: ScanConfig,
  mask: string,
  breaches: BreachFinding[],
  accounts: AccountFinding[],
  presence: PresenceFinding[],
  correlations: Correlation[],
): ReportGraph {
  const nodes: ReportGraph["nodes"] = [];
  const edges: ReportGraph["edges"] = [];

  nodes.push({
    id: "identifier",
    type: "fxNode",
    position: { x: 460, y: 300 },
    data: { label: mask, sublabel: config.type === "email" ? "EMAIL" : "USERNAME", kind: "identifier" },
  });

  breaches.slice(0, 4).forEach((b, i) => {
    const id = `g_breach_${i}`;
    nodes.push({
      id,
      type: "fxNode",
      position: { x: 40, y: 60 + i * 150 },
      data: { label: b.platform, sublabel: b.breach_date.slice(0, 4), kind: "breach", status: b.severity },
    });
    edges.push({ id: `e_b_${i}`, source: "identifier", target: id, label: "matched", animated: false });
  });

  const strong = accounts.filter((a) => a.status === "confirmed" || a.status === "likely").slice(0, 5);
  const present = presence.filter((p) => p.status === "registered" || p.status === "possible").slice(0, 5);
  const accountNodeIds: string[] = [];

  if (strong.length > 0) {
    strong.forEach((a, i) => {
      const id = `g_acct_${i}`;
      accountNodeIds.push(id);
      nodes.push({
        id,
        type: "fxNode",
        position: { x: 880, y: 30 + i * 135 },
        data: { label: a.platform, sublabel: a.username, kind: "account", status: a.status, hue: a.profile?.avatar_hue },
      });
      edges.push({
        id: `e_a_${i}`,
        source: "identifier",
        target: id,
        label: `${a.source} · ${(a.confidence * 100).toFixed(0)}%`,
        animated: true,
      });
    });
  } else {
    present.forEach((p, i) => {
      const id = `g_pres_${i}`;
      accountNodeIds.push(id);
      nodes.push({
        id,
        type: "fxNode",
        position: { x: 880, y: 30 + i * 135 },
        data: { label: p.platform, sublabel: "presence", kind: "presence", status: p.status },
      });
      edges.push({
        id: `e_p_${i}`,
        source: "identifier",
        target: id,
        label: `holehe · ${(p.confidence * 100).toFixed(0)}%`,
        animated: true,
      });
    });
  }

  // Shared attribute nodes
  const websites = strong.filter((a) => a.profile?.website);
  if (websites.length >= 1) {
    const id = "g_attr_website";
    nodes.push({
      id,
      type: "fxNode",
      position: { x: 1250, y: 140 },
      data: { label: "Personal website", sublabel: websites[0]?.profile?.website ?? "", kind: "attribute" },
    });
    websites.slice(0, 3).forEach((w, i) => {
      const idx = strong.indexOf(w);
      if (idx >= 0) edges.push({ id: `e_w_${i}`, source: `g_acct_${idx}`, target: id, label: "links", animated: false });
    });
  }
  const avatarShared = strong.length >= 2 && correlations.some((c) => c.signals.find((s) => s.label === "Same public avatar")?.matched);
  if (avatarShared) {
    const id = "g_attr_avatar";
    nodes.push({
      id,
      type: "fxNode",
      position: { x: 1250, y: 380 },
      data: { label: "Shared avatar", sublabel: "identical image hash", kind: "attribute" },
    });
    strong.slice(0, 3).forEach((_, i) => edges.push({ id: `e_av_${i}`, source: `g_acct_${i}`, target: id, label: "reuses", animated: false }));
  }

  // Correlation edges between account nodes
  correlations.forEach((c, i) => {
    const ia = strong.findIndex((a) => a.platform === c.pair[0]);
    const ib = strong.findIndex((a) => a.platform === c.pair[1]);
    if (ia >= 0 && ib >= 0 && ia !== ib) {
      edges.push({
        id: `e_corr_${i}`,
        source: `g_acct_${ia}`,
        target: `g_acct_${ib}`,
        label: `corr ${(c.confidence * 100).toFixed(0)}%`,
        animated: c.confidence >= 0.75,
      });
    }
  });

  return { nodes, edges };
}
