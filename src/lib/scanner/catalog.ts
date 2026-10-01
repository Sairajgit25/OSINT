// FootprintX — simulation catalogs.
// All breach entries are real, publicly documented historical incidents
// (public knowledge via breach-notification services). No credentials,
// hashes or raw values are ever present — only metadata (§31).

export interface BreachCatalogEntry {
  name: string;
  domain: string;
  date: string; // ISO date
  pwnCount: number; // affected accounts, public reporting
  dataTypes: string[];
  severity: "critical" | "high" | "moderate";
  verified: boolean;
  story: string;
}

export const BREACH_CATALOG: BreachCatalogEntry[] = [
  {
    name: "Collection #1",
    domain: "credential-stuffing.list",
    date: "2019-01-07",
    pwnCount: 772_904_991,
    dataTypes: ["Email addresses", "Plaintext passwords (aggregated)"],
    severity: "critical",
    verified: true,
    story: "Aggregated credential-stuffing list circulating on hacking forums; not a single-site breach but a compilation of many.",
  },
  {
    name: "LinkedIn",
    domain: "linkedin.com",
    date: "2021-06-22",
    pwnCount: 164_611_595,
    dataTypes: ["Email addresses", "Names", "Phone numbers", "Job titles", "Geolocation records"],
    severity: "high",
    verified: true,
    story: "Scraped profile data of ~164M users posted for sale; includes names, employers and inferred contact details.",
  },
  {
    name: "Wattpad",
    domain: "wattpad.com",
    date: "2020-06-29",
    pwnCount: 268_375_751,
    dataTypes: ["Email addresses", "Usernames", "Passwords (bcrypt-hashed)", "Dates of birth", "Geographic locations"],
    severity: "high",
    verified: true,
    story: "Story-platform database breach exposing account metadata and weakly-hashed passwords.",
  },
  {
    name: "Adobe",
    domain: "adobe.com",
    date: "2013-10-04",
    pwnCount: 152_445_165,
    dataTypes: ["Email addresses", "Encrypted passwords", "Password hints", "Usernames"],
    severity: "critical",
    verified: true,
    story: "Classic breach where password hints combined with encrypted passwords made offline cracking highly effective.",
  },
  {
    name: "MyFitnessPal",
    domain: "myfitnesspal.com",
    date: "2018-02-01",
    pwnCount: 143_606_147,
    dataTypes: ["Email addresses", "Usernames", "Hashed passwords", "IP addresses"],
    severity: "high",
    verified: true,
    story: "Under Armour disclosed unauthorized access to the fitness platform's user database.",
  },
  {
    name: "Zynga",
    domain: "zynga.com",
    date: "2019-09-01",
    pwnCount: 172_869_660,
    dataTypes: ["Email addresses", "Usernames", "Hashed passwords", "Phone numbers"],
    severity: "high",
    verified: true,
    story: "Gaming-network credential breach affecting Words With Friends players and other titles.",
  },
  {
    name: "Canva",
    domain: "canva.com",
    date: "2019-05-24",
    pwnCount: 137_272_116,
    dataTypes: ["Email addresses", "Names", "Usernames", "Hashed passwords", "Geographic locations"],
    severity: "moderate",
    verified: true,
    story: "Design-tool breach later distributed via a credential-stuffing list; bcrypt hashing limited password exposure.",
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    date: "2012-07-01",
    pwnCount: 68_648_009,
    dataTypes: ["Email addresses", "Hashed passwords"],
    severity: "high",
    verified: true,
    story: "Reuse of an employee password from the earlier LinkedIn breach led to the incident — a canonical reuse attack.",
  },
  {
    name: "Tumblr",
    domain: "tumblr.com",
    date: "2013-02-28",
    pwnCount: 65_469_298,
    dataTypes: ["Email addresses", "Salted+hashed passwords"],
    severity: "moderate",
    verified: true,
    story: "Breach disclosed years after the fact when the dataset surfaced publicly.",
  },
  {
    name: "MySpace",
    domain: "myspace.com",
    date: "2008-07-01",
    pwnCount: 359_420_698,
    dataTypes: ["Email addresses", "Usernames", "Weakly-hashed passwords"],
    severity: "high",
    verified: true,
    story: "Legacy-era breach with weak hashing; credentials remain useful to attackers because of password reuse.",
  },
];

export interface PlatformCatalogEntry {
  platform: string;
  category: string;
  urlTemplate: (u: string) => string;
  source: "sherlock" | "whatsmyname";
  hue: number;
}

export const PLATFORM_CATALOG: PlatformCatalogEntry[] = [
  { platform: "GitHub", category: "Developer", urlTemplate: (u) => `https://github.com/${u}`, source: "sherlock", hue: 35 },
  { platform: "Reddit", category: "Forum", urlTemplate: (u) => `https://www.reddit.com/user/${u}`, source: "sherlock", hue: 16 },
  { platform: "Instagram", category: "Social", urlTemplate: (u) => `https://www.instagram.com/${u}`, source: "sherlock", hue: 320 },
  { platform: "Pinterest", category: "Social", urlTemplate: (u) => `https://www.pinterest.com/${u}`, source: "sherlock", hue: 350 },
  { platform: "Twitch", category: "Streaming", urlTemplate: (u) => `https://www.twitch.tv/${u}`, source: "sherlock", hue: 275 },
  { platform: "X (Twitter)", category: "Social", urlTemplate: (u) => `https://x.com/${u}`, source: "sherlock", hue: 200 },
  { platform: "GitLab", category: "Developer", urlTemplate: (u) => `https://gitlab.com/${u}`, source: "sherlock", hue: 25 },
  { platform: "Keybase", category: "Security", urlTemplate: (u) => `https://keybase.io/${u}`, source: "whatsmyname", hue: 130 },
  { platform: "SoundCloud", category: "Music", urlTemplate: (u) => `https://soundcloud.com/${u}`, source: "whatsmyname", hue: 20 },
  { platform: "DeviantArt", category: "Creative", urlTemplate: (u) => `https://www.deviantart.com/${u}`, source: "whatsmyname", hue: 260 },
  { platform: "Hacker News", category: "Forum", urlTemplate: (u) => `https://news.ycombinator.com/user?id=${u}`, source: "whatsmyname", hue: 30 },
  { platform: "Pastebin", category: "Documents", urlTemplate: (u) => `https://pastebin.com/u/${u}`, source: "whatsmyname", hue: 60 },
  { platform: "Steam", category: "Gaming", urlTemplate: (u) => `https://steamcommunity.com/id/${u}`, source: "whatsmyname", hue: 210 },
  { platform: "SlideShare", category: "Documents", urlTemplate: (u) => `https://www.slideshare.net/${u}`, source: "whatsmyname", hue: 140 },
];

/** Holehe-style services for email → account presence signals */
export const PRESENCE_CATALOG: {
  platform: string;
  noteFound: string;
  noteMissing: string;
}[] = [
  { platform: "Instagram", noteFound: "Email accepted on password recovery flow", noteMissing: "No account bound to this address" },
  { platform: "Pinterest", noteFound: "Recovery flow recognizes this address", noteMissing: "No account bound to this address" },
  { platform: "Tumblr", noteFound: "Recovery flow recognizes this address", noteMissing: "No account bound to this address" },
  { platform: "Spotify", noteFound: "Email recognized on signup-check endpoint", noteMissing: "Address unknown to signup check" },
  { platform: "X (Twitter)", noteFound: "Password-reset recognizes this address", noteMissing: "No account bound to this address" },
  { platform: "Imgur", noteFound: "Recovery flow recognizes this address", noteMissing: "No account bound to this address" },
  { platform: "GitHub", noteFound: "Email accepted on password recovery flow", noteMissing: "No account bound to this address" },
  { platform: "Yahoo", noteFound: "Recovery flow recognizes this address", noteMissing: "Address unknown to recovery flow" },
  { platform: "About.me", noteFound: "Recovery flow recognizes this address", noteMissing: "No account bound to this address" },
  { platform: "Smule", noteFound: "Email recognized on password reset", noteMissing: "Address unknown to reset flow" },
];

/** Public-web mention templates (§33) */
export const MENTION_TEMPLATES: {
  kind: "repo" | "forum" | "website" | "document" | "other";
  title: (u: string) => string;
  url: (u: string) => string;
  snippet: (u: string) => string;
}[] = [
  {
    kind: "repo",
    title: (u) => `${u}/dotfiles — environment configuration repository`,
    url: (u) => `https://github.com/${u}/dotfiles`,
    snippet: (u) => `Public repository by ${u}; commit history references personal tooling and an exposed email in commit metadata.`,
  },
  {
    kind: "repo",
    title: (u) => `${u}/portfolio-site — static personal website`,
    url: (u) => `https://github.com/${u}/portfolio-site`,
    snippet: () => "Repository contains contact email in README and deployment configuration with a personal domain.",
  },
  {
    kind: "forum",
    title: (u) => `Forum thread: "Anyone using ${u}'s CLI tool?"`,
    url: (u) => `https://forum.example.dev/t/thread-${u}`,
    snippet: () => "Community discussion quoting the identifier in a quote-reply chain; page publicly indexed.",
  },
  {
    kind: "forum",
    title: (u) => `Q&A answer by ${u} on developer board`,
    url: (u) => `https://answers.example.dev/users/${u}`,
    snippet: () => "Answer includes signature with personal website link and display name matching the scanned identifier.",
  },
  {
    kind: "website",
    title: (u) => `Personal homepage of ${u}`,
    url: (u) => `https://${u}.example.dev`,
    snippet: (u) => `About page lists contact email, social handles and a short bio. Publicly indexed for ${u}.`,
  },
  {
    kind: "document",
    title: () => "Conference speaker biography (PDF)",
    url: (u) => `https://conf-archive.example.dev/2019/speakers/${u}.pdf`,
    snippet: () => "Archived speaker PDF with email address and employer name in the contact block.",
  },
  {
    kind: "document",
    title: (u) => `Public paste referencing ${u}`,
    url: () => `https://pastebin.example.archive/p/8f3k2`,
    snippet: () => "Text paste containing an identifier mention; authorship and intent unknown.",
  },
  {
    kind: "other",
    title: (u) => `Mailing-list archive mention of ${u}`,
    url: (u) => `https://lists.example.dev/search?q=${u}`,
    snippet: () => "Open-source mailing list archive exposes the address in message headers.",
  },
];

export const SCANNER_VERSIONS: Record<string, string> = {
  xposedornot: "1.2.0",
  sherlock: "0.15.0",
  whatsmyname: "2024.3",
  holehe: "3.1.1",
  searxng: "2024.4.9",
  hibp: "not-configured",
};

export const SCANNER_HEALTH: {
  name: string;
  category: string;
  status: "operational" | "not-configured" | "phase-2";
  detail: string;
}[] = [
  { name: "XposedOrNot", category: "Breach provider", status: "operational", detail: "No-key basic API · rate-limited 2 req/s, 25/hour" },
  { name: "Sherlock", category: "Username scanner", status: "operational", detail: "400+ site checks · async worker pool" },
  { name: "WhatsMyName", category: "Username dataset", status: "operational", detail: "Structured site registry synced from dataset" },
  { name: "Holehe", category: "Email account scanner", status: "operational", detail: "Recovery-flow presence checks" },
  { name: "HIBP", category: "Breach provider", status: "not-configured", detail: "Optional secondary — API key not set; scan continues without it" },
  { name: "SearXNG (Public Web)", category: "Search engine", status: "phase-2", detail: "Planned Phase 2 · deep scan uses simulated index" },
];
