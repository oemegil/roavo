import { normalizeDestinationName } from "@/server/domain/destinations/normalize";

export type RankableDestination = {
  id: string;
  name: string;
  normalizedName: string;
  countryName: string;
  regionName: string | null;
  searchKeywords: string[];
  popularityScore: number;
};

/**
 * Deterministic search ranking (lower score = better).
 * 1 exact normalized name
 * 2 prefix match
 * 3 name substring
 * 4 country / region
 * 5 keyword
 * 6 popularity (inverted)
 * 7 name tie-breaker
 */
export function scoreDestinationMatch(
  destination: RankableDestination,
  normalizedQuery: string,
): number {
  if (!normalizedQuery) {
    return 1_000_000 - destination.popularityScore;
  }

  const name = destination.normalizedName;
  const country = normalizeDestinationName(destination.countryName);
  const region = destination.regionName
    ? normalizeDestinationName(destination.regionName)
    : "";
  const keywords = destination.searchKeywords.map(normalizeDestinationName);

  let rankBand = 600;
  if (name === normalizedQuery) {
    rankBand = 0;
  } else if (name.startsWith(normalizedQuery)) {
    rankBand = 100;
  } else if (name.includes(normalizedQuery)) {
    rankBand = 200;
  } else if (country.includes(normalizedQuery) || region.includes(normalizedQuery)) {
    rankBand = 300;
  } else if (keywords.some((keyword) => keyword.includes(normalizedQuery))) {
    rankBand = 400;
  }

  const popularityComponent = Math.max(0, 10_000 - destination.popularityScore);
  const nameTieBreaker = name.charCodeAt(0) || 0;
  return rankBand * 100_000 + popularityComponent * 10 + nameTieBreaker;
}

export function sortDestinationsByRank<T extends RankableDestination>(
  destinations: T[],
  normalizedQuery: string,
): T[] {
  return [...destinations].sort((a, b) => {
    const scoreDiff =
      scoreDestinationMatch(a, normalizedQuery) -
      scoreDestinationMatch(b, normalizedQuery);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id.localeCompare(b.id);
  });
}
