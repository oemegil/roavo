import "server-only";

import type { Destination, DestinationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/infrastructure/database";
import { normalizeSearchQuery } from "@/server/domain/destinations/normalize";
import { sortDestinationsByRank } from "@/server/domain/destinations/ranking";
import type { DestinationSearchQuery } from "@/features/destinations/schemas";

export type DestinationSearchCriteria = DestinationSearchQuery;

function buildActiveWhere(
  criteria: DestinationSearchCriteria,
): Prisma.DestinationWhereInput {
  const where: Prisma.DestinationWhereInput = {
    status: "ACTIVE",
  };

  if (criteria.type) where.type = criteria.type;
  if (criteria.countryCode) where.countryCode = criteria.countryCode;
  if (criteria.budgetLevel) where.budgetLevel = criteria.budgetLevel;
  if (criteria.category) where.categories = { has: criteria.category };
  if (criteria.bestFor) where.bestFor = { has: criteria.bestFor };

  if (criteria.q) {
    const normalized = normalizeSearchQuery(criteria.q);
    where.OR = [
      { normalizedName: { contains: normalized } },
      { name: { contains: criteria.q, mode: "insensitive" } },
      { countryName: { contains: criteria.q, mode: "insensitive" } },
      { regionName: { contains: criteria.q, mode: "insensitive" } },
      { searchKeywords: { has: normalized } },
    ];
  }

  return where;
}

/**
 * Cursor encodes rank position via destination id after deterministic sort.
 * For small curated catalogs we load a bounded window and paginate in memory.
 */
export async function searchActiveDestinations(
  criteria: DestinationSearchCriteria,
): Promise<{ items: Destination[]; nextCursor: string | null }> {
  const where = buildActiveWhere(criteria);
  const candidates = await prisma.destination.findMany({
    where,
    take: 200,
  });

  const normalizedQuery = criteria.q
    ? normalizeSearchQuery(criteria.q)
    : "";
  const ranked = sortDestinationsByRank(candidates, normalizedQuery);

  let startIndex = 0;
  if (criteria.cursor) {
    const cursorIndex = ranked.findIndex((item) => item.id === criteria.cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const page = ranked.slice(startIndex, startIndex + criteria.limit);
  const next =
    startIndex + criteria.limit < ranked.length
      ? page[page.length - 1]?.id ?? null
      : null;

  return { items: page, nextCursor: next };
}

export async function listFeaturedDestinations(
  limit = 12,
): Promise<Destination[]> {
  return prisma.destination.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: [
      { featuredPosition: "asc" },
      { popularityScore: "desc" },
      { name: "asc" },
    ],
    take: limit,
  });
}

export async function findActiveDestinationById(
  id: string,
): Promise<Destination | null> {
  return prisma.destination.findFirst({
    where: { id, status: "ACTIVE" },
  });
}

export async function findActiveDestinationBySlug(
  slug: string,
): Promise<Destination | null> {
  return prisma.destination.findFirst({
    where: { slug, status: "ACTIVE" },
  });
}

export async function findDestinationByIdAnyStatus(
  id: string,
): Promise<Destination | null> {
  return prisma.destination.findUnique({ where: { id } });
}

export async function findByProviderReference(input: {
  provider:
    | "MANUAL"
    | "GEONAMES"
    | "MAPBOX"
    | "GOOGLE_PLACES"
    | "OPENSTREETMAP"
    | "CUSTOM";
  providerDestinationId: string;
}): Promise<Destination | null> {
  const ref = await prisma.destinationProviderReference.findUnique({
    where: {
      provider_providerDestinationId: {
        provider: input.provider,
        providerDestinationId: input.providerDestinationId,
      },
    },
    include: { destination: true },
  });
  return ref?.destination ?? null;
}

export async function upsertDestinationBySlug(
  data: Prisma.DestinationCreateInput,
): Promise<Destination> {
  return prisma.destination.upsert({
    where: { slug: data.slug },
    create: data,
    update: {
      name: data.name,
      normalizedName: data.normalizedName,
      type: data.type,
      status: data.status,
      countryCode: data.countryCode,
      countryName: data.countryName,
      regionName: data.regionName,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      primaryLanguage: data.primaryLanguage,
      currencyCode: data.currencyCode,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      budgetLevel: data.budgetLevel,
      minimumRecommendedDays: data.minimumRecommendedDays,
      maximumRecommendedDays: data.maximumRecommendedDays,
      popularityScore: data.popularityScore,
      searchKeywords: data.searchKeywords,
      categories: data.categories,
      bestFor: data.bestFor,
      heroImageUrl: data.heroImageUrl,
      heroImageAlt: data.heroImageAlt,
      imageAttribution: data.imageAttribution,
      practicalNotes: data.practicalNotes,
      isFeatured: data.isFeatured,
      featuredPosition: data.featuredPosition,
      publishedAt: data.publishedAt,
      archivedAt: data.archivedAt,
    },
  });
}

export type { Destination, DestinationStatus };
