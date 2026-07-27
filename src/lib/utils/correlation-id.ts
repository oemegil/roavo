import { randomUUID } from "node:crypto";

const CORRELATION_ID_HEADER = "x-correlation-id";
const MAX_CORRELATION_ID_LENGTH = 128;
const SAFE_CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

export function getCorrelationIdHeaderName(): string {
  return CORRELATION_ID_HEADER;
}

export function createCorrelationId(): string {
  return randomUUID();
}

/**
 * Accepts a caller-provided correlation ID only when it is short and safe to log.
 * Otherwise generates a new ID.
 */
export function resolveCorrelationId(candidate: string | null | undefined): string {
  if (!candidate) {
    return createCorrelationId();
  }

  const trimmed = candidate.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_CORRELATION_ID_LENGTH ||
    !SAFE_CORRELATION_ID_PATTERN.test(trimmed)
  ) {
    return createCorrelationId();
  }

  return trimmed;
}
