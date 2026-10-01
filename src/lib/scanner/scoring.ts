// FootprintX — Risk Engine (§25).
// Heuristic exposure score, 0–100. This is the application's own heuristic,
// explicitly NOT an industry-standard security score.

import type {
  AccountFinding,
  BreachFinding,
  IdentifierType,
  MentionFinding,
  PresenceFinding,
  RiskAssessment,
  RiskContribution,
} from "./types";

export function bandFor(score: number): RiskAssessment["band"] {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "ELEVATED";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export interface ScoreInput {
  identifierType: IdentifierType;
  breaches: BreachFinding[];
  accounts: AccountFinding[];
  presence: PresenceFinding[];
  mentions: MentionFinding[];
}

export function computeRisk(input: ScoreInput): RiskAssessment {
  const { breaches, accounts, presence, mentions } = input;
  const contributions: RiskContribution[] = [];
  const add = (
    rule: string,
    label: string,
    points: number,
    triggered: boolean,
    detail: string,
  ) => contributions.push({ rule, label, points, triggered, detail });

  // §25 rules
  const nBreaches = breaches.length;
  add(
    "no_breach",
    "No known breaches",
    0,
    nBreaches === 0,
    nBreaches === 0 ? "No breached organizations matched this identifier." : `${nBreaches} breaches matched.`,
  );
  add(
    "single_breach",
    "Single breach exposure",
    10,
    nBreaches === 1,
    nBreaches === 1 ? `${breaches[0].platform} (${breaches[0].breach_date.slice(0, 4)})` : "Not applicable.",
  );
  add(
    "multiple_breaches",
    "Multiple breach exposure",
    20,
    nBreaches >= 2,
    nBreaches >= 2 ? `${nBreaches} distinct breached organizations matched this identifier.` : "Fewer than two breaches matched.",
  );

  const passwordMeta = breaches.some((b) =>
    /password/i.test(b.data_types.join(" ")),
  );
  const worstBreach = [...breaches].sort((a, b) => b.pwn_count - a.pwn_count)[0];
  add(
    "password_metadata",
    "Credential/password metadata exposed",
    25,
    passwordMeta,
    passwordMeta
      ? `Password fields present in at least one breach (largest: ${worstBreach?.platform ?? "n/a"}).`
      : "No password fields present in matched breaches.",
  );

  const emailIndexed = mentions.some((m) =>
    /email|mail|@/i.test(`${m.title} ${m.snippet}`),
  );
  add(
    "email_indexed",
    "Email publicly indexed",
    10,
    emailIndexed,
    emailIndexed
      ? "Search-indexed pages reference this email address."
      : "No indexed pages reference this email.",
  );

  const phoneIndexed = mentions.some((m) =>
    /phone|mobile|\+\d{1,3}[- ]?\d/i.test(`${m.title} ${m.snippet}`),
  );
  add(
    "phone_indexed",
    "Phone publicly indexed",
    20,
    phoneIndexed,
    phoneIndexed
      ? "Search-indexed pages reference a phone number tied to this identity."
      : "No indexed phone references found.",
  );

  const foundAccounts = accounts.filter((a) =>
    ["confirmed", "likely"].includes(a.status),
  );
  add(
    "account_associations",
    "Many account associations",
    10,
    foundAccounts.length >= 6,
    `${foundAccounts.length} matching accounts discovered across platforms (threshold: 6).`,
  );

  const sensitive = mentions.some((m) =>
    /employer|address|resume|speaker|bio|salary|cv/i.test(`${m.title} ${m.snippet}`),
  );
  add(
    "sensitive_public",
    "Sensitive public information",
    20,
    sensitive,
    sensitive
      ? "Indexed documents/pages reveal personal details (bio, employer or contact block)."
      : "No clearly sensitive indexed content found.",
  );

  const reusedUsername =
    input.identifierType === "username"
      ? foundAccounts.length >= 3
      : foundAccounts.filter((a) =>
          ["confirmed", "likely"].includes(a.status),
        ).length >= 3;
  add(
    "username_reuse",
    "Reused username across platforms",
    10,
    reusedUsername,
    reusedUsername
      ? "The same handle resolves on 3+ platforms — reusable for targeted discovery."
      : "Handle reuse below threshold.",
  );

  const raw = contributions.reduce((sum, c) => sum + (c.triggered ? c.points : 0), 0);
  const capped = raw > 100;
  const score = Math.min(100, raw);

  return {
    score,
    band: bandFor(score),
    contributions,
    capped,
    disclaimer:
      "The Exposure Score is FootprintX's own weighted heuristic (§25), not an industry-standard security score. It measures observable public exposure, not actual compromise.",
  };
}
