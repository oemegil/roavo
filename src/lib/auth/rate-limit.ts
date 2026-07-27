import "server-only";

import { RateLimitError } from "@/lib/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * In-memory rate limiter for MVP / local development.
 * Not suitable for multi-instance production — swap for Redis/Upstash later.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string): void {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (existing.count >= this.limit) {
      throw new RateLimitError(
        "Too many attempts. Please wait a moment and try again.",
      );
    }

    existing.count += 1;
  }
}

export const authRateLimiter = new InMemoryRateLimiter(10, 60_000);
export const registrationRateLimiter = new InMemoryRateLimiter(5, 60_000);
/** Light limiter for public destination search (catalog-only; not per-keystroke). */
export const destinationSearchRateLimiter = new InMemoryRateLimiter(60, 60_000);
export const aiRecommendationRateLimiter = new InMemoryRateLimiter(8, 60_000);
export const aiGenerationRateLimiter = new InMemoryRateLimiter(4, 60_000);
export const aiEditRateLimiter = new InMemoryRateLimiter(10, 60_000);
