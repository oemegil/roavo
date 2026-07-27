/**
 * Centralized destination name normalization for search and matching.
 * Preserves display names separately — never mutate the original name.
 *
 * Policy: we normalize for matching only. Full user search text may be
 * omitted from logs; prefer query length + filters in operational logs.
 */

const TURKISH_CHAR_MAP: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

function mapTurkishChars(value: string): string {
  return value.replace(/[ıİşŞğĞüÜöÖçÇ]/g, (char) => TURKISH_CHAR_MAP[char] ?? char);
}

/**
 * Normalize a destination name for search indexing and comparisons.
 * - Unicode NFKD
 * - Turkish-aware Latin mapping before diacritic stripping
 * - Strip combining marks (accent-insensitive)
 * - Lowercase, trim, collapse whitespace
 */
export function normalizeDestinationName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const turkishMapped = mapTurkishChars(trimmed);
  const decomposed = turkishMapped.normalize("NFKD");
  const withoutMarks = decomposed.replace(/\p{M}/gu, "");
  const lower = withoutMarks.toLowerCase();
  return lower.replace(/\s+/g, " ").trim();
}

export function normalizeSearchQuery(input: string): string {
  return normalizeDestinationName(input);
}
