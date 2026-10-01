// FootprintX — Recommendations Engine (§35).
// Never just "you are exposed" — always paired with concrete actions.

import type { BreachFinding, MentionFinding, Recommendation } from "./types";

export function buildRecommendations(
  breaches: BreachFinding[],
  mentions: MentionFinding[],
  score: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  const passwordBreaches = breaches.filter((b) =>
    /password/i.test(b.data_types.join(" ")),
  );

  if (breaches.length > 0) {
    const items = [
      {
        text: `Change passwords reused on affected services (${passwordBreaches
          .slice(0, 3)
          .map((b) => b.platform)
          .join(", ")}${passwordBreaches.length > 3 ? ", …" : ""})`,
        done: false,
      },
      { text: "Enable multi-factor authentication on every affected account", done: false },
      { text: "Review active sessions and revoke unfamiliar devices", done: false },
      { text: "Remove public email addresses from old, unused profiles", done: false },
    ];
    recs.push({
      id: "rec_breach",
      severity: breaches.length >= 3 ? "critical" : "high",
      category: "action",
      title: `${breaches.length} breach${breaches.length > 1 ? "es" : ""} detected — action required`,
      items,
    });
  }

  const docMentions = mentions.filter((m) =>
    /employer|address|resume|speaker|bio|cv|salary/i.test(`${m.title} ${m.snippet}`),
  );
  if (docMentions.length > 0) {
    recs.push({
      id: "rec_privacy",
      severity: "moderate",
      category: "privacy",
      title: "Privacy improvement — personal details are publicly indexed",
      items: [
        { text: "Remove phone/contact details from public profiles and bios", done: false },
        { text: "Check search-engine removal options (e.g. data-vendor opt-outs)", done: false },
        { text: `Review old marketplace, forum and archive accounts (${docMentions.length} indexed references found)`, done: false },
      ],
    });
  }

  if (mentions.length > 0) {
    recs.push({
      id: "rec_hygiene",
      severity: "low",
      category: "hygiene",
      title: "Reduce public-web mentions",
      items: [
        { text: "Purge email addresses from READMEs, pastes and commit metadata", done: false },
        { text: "Use a relay/alias address for public sign-ups instead of your primary email", done: false },
        { text: "Set profiles you no longer use to private, or delete the accounts", done: false },
      ],
    });
  }

  if (score >= 41) {
    recs.push({
      id: "rec_monitor",
      severity: score >= 61 ? "high" : "moderate",
      category: "monitoring",
      title: "Keep watching your exposure",
      items: [
        { text: "Re-run a deep scan monthly to catch new breaches and accounts", done: false },
        { text: "Subscribe to breach notifications for this identifier (opt-in only)", done: false },
        { text: "Use a password manager to generate unique credentials per service", done: false },
      ],
    });
  }

  return recs;
}
