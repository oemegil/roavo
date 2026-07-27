import { describe, expect, it } from "vitest";

import { normalizeDestinationName } from "@/server/domain/destinations/normalize";
import {
  resolveUniqueSlug,
  slugifyDestinationName,
} from "@/server/domain/destinations/slug";
import {
  scoreDestinationMatch,
  sortDestinationsByRank,
} from "@/server/domain/destinations/ranking";
import {
  assertValidCoordinates,
  assertValidRecommendedDuration,
  isPlausibleIanaTimezone,
} from "@/server/domain/destinations/validation";
import { AppError } from "@/lib/errors";

describe("normalizeDestinationName", () => {
  it("normalizes Turkish characters predictably", () => {
    expect(normalizeDestinationName("İstanbul")).toBe("istanbul");
    expect(normalizeDestinationName("Istanbul")).toBe("istanbul");
    expect(normalizeDestinationName("istanbul")).toBe("istanbul");
    expect(normalizeDestinationName("  Kapadokya  ")).toBe("kapadokya");
  });

  it("strips accented Latin characters", () => {
    expect(normalizeDestinationName("São Paulo")).toBe("sao paulo");
    expect(normalizeDestinationName("México")).toBe("mexico");
    expect(normalizeDestinationName("Köln")).toBe("koln");
  });

  it("collapses whitespace", () => {
    expect(normalizeDestinationName("New   York")).toBe("new york");
  });
});

describe("slug generation", () => {
  it("creates url-safe slugs", () => {
    expect(slugifyDestinationName("Amalfi Coast")).toBe("amalfi-coast");
    expect(slugifyDestinationName("São Paulo")).toBe("sao-paulo");
  });

  it("resolves collisions with country qualifier", () => {
    const slug = resolveUniqueSlug({
      name: "Granada",
      countryCode: "ES",
      existingSlugs: ["granada"],
    });
    expect(slug).toBe("granada-es");
  });

  it("adds numeric suffix after country collision", () => {
    const slug = resolveUniqueSlug({
      name: "Granada",
      countryCode: "ES",
      existingSlugs: ["granada", "granada-es"],
    });
    expect(slug).toBe("granada-es-2");
  });
});

describe("ranking", () => {
  const destinations = [
    {
      id: "1",
      name: "Lisbon",
      normalizedName: "lisbon",
      countryName: "Portugal",
      regionName: null,
      searchKeywords: [],
      popularityScore: 10,
    },
    {
      id: "2",
      name: "Lisboa Coast",
      normalizedName: "lisboa coast",
      countryName: "Portugal",
      regionName: null,
      searchKeywords: ["lisbon"],
      popularityScore: 90,
    },
    {
      id: "3",
      name: "Porto",
      normalizedName: "porto",
      countryName: "Portugal",
      regionName: null,
      searchKeywords: [],
      popularityScore: 80,
    },
  ];

  it("ranks exact matches first", () => {
    const ranked = sortDestinationsByRank(destinations, "lisbon");
    expect(ranked[0]?.id).toBe("1");
  });

  it("is deterministic for equal scores", () => {
    const a = scoreDestinationMatch(destinations[2]!, "xyz");
    const b = scoreDestinationMatch(destinations[2]!, "xyz");
    expect(a).toBe(b);
  });
});

describe("validation helpers", () => {
  it("accepts valid coordinates", () => {
    expect(() => assertValidCoordinates(41, 29)).not.toThrow();
  });

  it("rejects invalid latitude", () => {
    expect(() => assertValidCoordinates(100, 29)).toThrow(AppError);
  });

  it("validates recommended duration bounds", () => {
    expect(() => assertValidRecommendedDuration(3, 5)).not.toThrow();
    expect(() => assertValidRecommendedDuration(5, 3)).toThrow(AppError);
  });

  it("checks plausible IANA timezones", () => {
    expect(isPlausibleIanaTimezone("Europe/Istanbul")).toBe(true);
    expect(isPlausibleIanaTimezone("Not/AZone")).toBe(false);
  });
});
