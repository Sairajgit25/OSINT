// FootprintX — shared domain types (§16 Unified Finding Schema)

export type IdentifierType = "email" | "username";
export type ScanMode = "quick" | "deep";
export type Retention = "d30" | "until_deleted" | "after_scan";
export type ScanStatus = "queued" | "running" | "completed" | "deleted" | "failed";

/** Confidence vocabulary per §26 — never conflate "found" with "confirmed" */
export type MatchStatus =
  | "confirmed"
  | "likely"
  | "possible"
  | "not_found"
  | "unknown";

export type Severity = "critical" | "high" | "moderate" | "low";

export interface ScanConfig {
  type: IdentifierType;
  value: string;
  mode: ScanMode;
  privacy: boolean;
  retention: Retention;
}

export interface BreachFinding {
  id: string;
  type: "breach";
  target_type: IdentifierType;
  source: "xposedornot" | "hibp";
  platform: string;
  domain: string;
  breach_date: string;
  pwn_count: number;
  data_types: string[];
  severity: Severity;
  verified: boolean;
  matched_by: string;
  evidence: Evidence;
}

export interface AccountFinding {
  id: string;
  type: "social_account";
  target_type: IdentifierType;
  source: "sherlock" | "whatsmyname";
  platform: string;
  username: string;
  url: string;
  status: MatchStatus;
  confidence: number;
  category: string;
  profile: {
    bio: string;
    joined: string;
    followers: number;
    website: string | null;
    location: string | null;
    avatar_hue: number;
  } | null;
  evidence: Evidence;
}

export interface PresenceFinding {
  id: string;
  type: "account_presence";
  target_type: IdentifierType;
  source: "holehe";
  platform: string;
  status: "registered" | "possible" | "not_registered" | "unknown";
  confidence: number;
  note: string;
  evidence: Evidence;
}

export type MentionKind = "repo" | "forum" | "website" | "document" | "other";

export interface MentionFinding {
  id: string;
  type: "public_reference";
  target_type: IdentifierType;
  source: "searxng";
  title: string;
  url: string;
  kind: MentionKind;
  date: string;
  snippet: string;
  evidence: Evidence;
}

export interface CorrelationSignal {
  label: string;
  matched: boolean;
}

export interface Correlation {
  id: string;
  pair: [string, string];
  confidence: number;
  verdict: string;
  signals: CorrelationSignal[];
}

export interface RiskContribution {
  rule: string;
  label: string;
  points: number;
  triggered: boolean;
  detail: string;
}

export interface RiskAssessment {
  score: number;
  band: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  contributions: RiskContribution[];
  capped: boolean;
  disclaimer: string;
}

export interface RecommendationItem {
  text: string;
  done: boolean;
}

export interface Recommendation {
  id: string;
  severity: Severity;
  category: "action" | "privacy" | "hygiene" | "monitoring";
  title: string;
  items: RecommendationItem[];
}

export interface Evidence {
  source: string;
  source_url: string;
  retrieved_at: string;
  scanner_version: string;
}

export interface EvidenceRow extends Evidence {
  id: string;
  finding_ref: string;
  finding_label: string;
  note: string;
}

export interface GraphNodeData {
  label: string;
  sublabel?: string;
  kind: "identifier" | "account" | "attribute" | "breach" | "presence";
  status?: MatchStatus | string;
  hue?: number;
}

export interface ReportGraph {
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: GraphNodeData;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    animated: boolean;
  }[];
}

export interface ReportSummary {
  breaches: number;
  accounts: number;
  mentions: number;
  risks: number;
  presence: number;
  earliest_breach: string | null;
  platforms: number;
}

export interface Report {
  scan_id: string;
  identifier: {
    type: IdentifierType;
    mask: string;
    hash: string;
    value: string | null; // null in privacy mode — never persisted anyway
  };
  mode: ScanMode;
  privacy: boolean;
  generated_at: string;
  scanner_versions: Record<string, string>;
  summary: ReportSummary;
  score: RiskAssessment;
  breaches: BreachFinding[];
  accounts: AccountFinding[];
  presence: PresenceFinding[];
  mentions: MentionFinding[];
  correlations: Correlation[];
  recommendations: Recommendation[];
  evidence: EvidenceRow[];
  graph: ReportGraph;
}

export interface StageInfo {
  key: string;
  label: string;
  detail: string;
  scanner: string;
  status: "pending" | "active" | "done";
}

export interface ScanEvent {
  at: number; // ms after scan creation
  level: "info" | "ok" | "warn" | "error";
  scope: string;
  message: string;
}

export interface ScanState {
  id: string;
  config: ScanConfig;
  status: ScanStatus;
  createdAt: number;
  stageDurations: number[];
  totalDuration: number;
  report: Report | null;
  persisted: boolean;
}
