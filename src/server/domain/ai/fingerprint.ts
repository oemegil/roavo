import { createHash } from "node:crypto";

export function createRequestFingerprint(parts: Record<string, unknown>): string {
  const normalized = JSON.stringify(parts, Object.keys(parts).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

export function previewExpiresAt(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function summarizeText(value: string | null | undefined, max = 80): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}
