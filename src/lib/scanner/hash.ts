// FootprintX — deterministic hashing & seeded PRNG.
// The simulation engine derives every finding from a stable hash of the
// identifier, so the same input always produces the same report (§6 MVP:
// deterministic, offline, zero external requests).

/** FNV-1a 32-bit hash */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** SHA-256 hex digest via Node crypto (route-handler side only) */
import { createHash } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Mulberry32 — small, fast, deterministic PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededRng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: T[]) => T;
  bool: (p?: number) => boolean;
  shuffle: <T>(arr: T[]) => T[];
}

export function rngFrom(seed: number): SeededRng {
  const next = mulberry32(seed);
  const int = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]) => arr[Math.floor(next() * arr.length)];
  const bool = (p = 0.5) => next() < p;
  const shuffle = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return { next, int, pick, bool, shuffle };
}

/** Mask an identifier for display: j***@example.com / alex*** */
export function maskIdentifier(type: "email" | "username", value: string): string {
  if (type === "email") {
    const [local, domain] = value.split("@");
    if (!domain) return local.slice(0, 1) + "***";
    const visible = local.slice(0, 1);
    return `${visible}${"*".repeat(Math.max(3, Math.min(local.length - 1, 5)))}@${domain}`;
  }
  const visible = value.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, Math.min(value.length - 2, 6)))}`;
}

/** Validate identifier shape */
export function validateIdentifier(
  type: "email" | "username",
  value: string,
): { valid: boolean; reason?: string } {
  const v = value.trim();
  if (type === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return ok ? { valid: true } : { valid: false, reason: "Enter a valid email address." };
  }
  const ok = /^[a-zA-Z0-9._-]{3,32}$/.test(v);
  if (!ok) {
    if (v.length < 3 || v.length > 32)
      return { valid: false, reason: "Username must be 3–32 characters." };
    return { valid: false, reason: "Only letters, digits, dot, underscore and dash are allowed." };
  }
  return { valid: true };
}

/** Deterministic "retrieved_at" timestamps inside the scan window */
export function isoAt(baseMs: number, offsetMs: number): string {
  return new Date(baseMs + offsetMs).toISOString();
}
