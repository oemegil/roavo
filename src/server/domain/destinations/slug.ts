import { DESTINATION_LIMITS } from "@/server/domain/destinations/constants";
import { normalizeDestinationName } from "@/server/domain/destinations/normalize";

/**
 * Generate a URL-safe slug from a destination name (+ optional country qualifier).
 * Slugs are stable after publication — do not regenerate on rename without an explicit migration.
 */
export function slugifyDestinationName(
  name: string,
  countryCode?: string | null,
): string {
  const base = normalizeDestinationName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, DESTINATION_LIMITS.slugMax);

  if (!base) {
    return countryCode
      ? `destination-${countryCode.toLowerCase()}`
      : "destination";
  }

  return base;
}

/**
 * Resolve a unique slug given existing collisions.
 * Prefer unqualified slug; on collision append country code then numeric suffix.
 */
export function resolveUniqueSlug(input: {
  name: string;
  countryCode: string;
  existingSlugs: Iterable<string>;
}): string {
  const existing = new Set(
    [...input.existingSlugs].map((slug) => slug.toLowerCase()),
  );
  const primary = slugifyDestinationName(input.name);
  if (!existing.has(primary)) return primary;

  const withCountry = slugifyDestinationName(
    `${input.name}-${input.countryCode.toLowerCase()}`,
  );
  if (!existing.has(withCountry)) return withCountry;

  let counter = 2;
  while (counter < 1000) {
    const candidate = `${withCountry}-${counter}`;
    if (!existing.has(candidate)) return candidate;
    counter += 1;
  }

  throw new Error("Unable to resolve a unique destination slug.");
}
