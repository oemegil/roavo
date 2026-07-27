import type {
  Destination,
  DestinationBudgetLevel,
  DestinationLocationSource,
  DestinationStatus,
  DestinationType,
} from "@prisma/client";

export type DestinationHeroImageDto = {
  url: string;
  alt: string;
  attribution: string | null;
};

export type DestinationSummaryDto = {
  id: string;
  slug: string;
  name: string;
  type: DestinationType;
  countryCode: string;
  countryName: string;
  regionName: string | null;
  shortDescription: string;
  categories: string[];
  bestFor: string[];
  budgetLevel: DestinationBudgetLevel;
  minimumRecommendedDays: number | null;
  maximumRecommendedDays: number | null;
  heroImage: DestinationHeroImageDto | null;
  isFeatured: boolean;
};

export type DestinationDetailDto = DestinationSummaryDto & {
  status: DestinationStatus;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  primaryLanguage: string | null;
  currencyCode: string | null;
  longDescription: string | null;
  practicalNotes: string | null;
  disclaimer:
    | "Bütçe seviyesi ve süreler editoryal planlama rehberidir; canlı fiyat veya garanti değildir.";
  publishedAt: string | null;
  updatedAt: string;
};

export type DestinationSearchResponseDto = {
  items: DestinationSummaryDto[];
  nextCursor: string | null;
  filters: {
    q: string | null;
    type: string | null;
    countryCode: string | null;
    category: string | null;
    budgetLevel: string | null;
    bestFor: string | null;
  };
};

export type TripDestinationDto = {
  destinationId: string | null;
  name: string | null;
  countryCode: string | null;
  regionName: string | null;
  source: DestinationLocationSource | null;
  slug: string | null;
};

function toHeroImage(destination: Destination): DestinationHeroImageDto | null {
  if (!destination.heroImageUrl) return null;
  return {
    url: destination.heroImageUrl,
    alt: destination.heroImageAlt ?? destination.name,
    attribution: destination.imageAttribution,
  };
}

function decimalToNumber(
  value: Destination["latitude"],
): number | null {
  if (value == null) return null;
  return Number(value);
}

export function toDestinationSummaryDto(
  destination: Destination,
): DestinationSummaryDto {
  return {
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    type: destination.type,
    countryCode: destination.countryCode,
    countryName: destination.countryName,
    regionName: destination.regionName,
    shortDescription: destination.shortDescription,
    categories: destination.categories,
    bestFor: destination.bestFor,
    budgetLevel: destination.budgetLevel,
    minimumRecommendedDays: destination.minimumRecommendedDays,
    maximumRecommendedDays: destination.maximumRecommendedDays,
    heroImage: toHeroImage(destination),
    isFeatured: destination.isFeatured,
  };
}

export function toDestinationDetailDto(
  destination: Destination,
): DestinationDetailDto {
  return {
    ...toDestinationSummaryDto(destination),
    status: destination.status,
    latitude: decimalToNumber(destination.latitude),
    longitude: decimalToNumber(destination.longitude),
    timezone: destination.timezone,
    primaryLanguage: destination.primaryLanguage,
    currencyCode: destination.currencyCode,
    longDescription: destination.longDescription,
    practicalNotes: destination.practicalNotes,
    disclaimer:
      "Bütçe seviyesi ve süreler editoryal planlama rehberidir; canlı fiyat veya garanti değildir.",
    publishedAt: destination.publishedAt?.toISOString() ?? null,
    updatedAt: destination.updatedAt.toISOString(),
  };
}

export function toTripDestinationDto(input: {
  destinationId: string | null;
  destinationName: string | null;
  destinationCountryCode: string | null;
  destinationRegionNameSnapshot: string | null;
  destinationSource: DestinationLocationSource | null;
  destinationSlug?: string | null;
}): TripDestinationDto {
  return {
    destinationId: input.destinationId,
    name: input.destinationName,
    countryCode: input.destinationCountryCode,
    regionName: input.destinationRegionNameSnapshot,
    source: input.destinationSource,
    slug: input.destinationSlug ?? null,
  };
}
