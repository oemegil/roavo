-- Destination Discovery foundation
-- Adds Destination catalog, provider references, and Trip destination relation/snapshot fields.
-- Existing Trip destination text fields are preserved and backfilled as MANUAL when present.

CREATE TYPE "DestinationType" AS ENUM (
  'CITY',
  'TOWN',
  'REGION',
  'ISLAND',
  'COASTAL_AREA',
  'NATIONAL_PARK',
  'DESTINATION_CLUSTER'
);

CREATE TYPE "DestinationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "DestinationBudgetLevel" AS ENUM (
  'BUDGET',
  'MODERATE',
  'PREMIUM',
  'LUXURY'
);

CREATE TYPE "DestinationLocationSource" AS ENUM ('CATALOG', 'MANUAL');

CREATE TYPE "DestinationProviderKind" AS ENUM (
  'MANUAL',
  'GEONAMES',
  'MAPBOX',
  'GOOGLE_PLACES',
  'OPENSTREETMAP',
  'CUSTOM'
);

CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL DEFAULT 'CITY',
    "status" "DestinationStatus" NOT NULL DEFAULT 'DRAFT',
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "regionName" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT,
    "primaryLanguage" TEXT,
    "currencyCode" TEXT,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT,
    "budgetLevel" "DestinationBudgetLevel" NOT NULL DEFAULT 'MODERATE',
    "minimumRecommendedDays" INTEGER,
    "maximumRecommendedDays" INTEGER,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heroImageUrl" TEXT,
    "heroImageAlt" TEXT,
    "imageAttribution" TEXT,
    "practicalNotes" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");
CREATE INDEX "destinations_status_popularityScore_idx" ON "destinations"("status", "popularityScore");
CREATE INDEX "destinations_normalizedName_idx" ON "destinations"("normalizedName");
CREATE INDEX "destinations_countryCode_status_idx" ON "destinations"("countryCode", "status");
CREATE INDEX "destinations_isFeatured_featuredPosition_idx" ON "destinations"("isFeatured", "featuredPosition");

CREATE TABLE "destination_provider_references" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "provider" "DestinationProviderKind" NOT NULL,
    "providerDestinationId" TEXT NOT NULL,
    "providerType" TEXT,
    "rawName" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_provider_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "destination_provider_references_destinationId_idx" ON "destination_provider_references"("destinationId");
CREATE UNIQUE INDEX "destination_provider_references_provider_providerDestinationId_key" ON "destination_provider_references"("provider", "providerDestinationId");

ALTER TABLE "destination_provider_references"
  ADD CONSTRAINT "destination_provider_references_destinationId_fkey"
  FOREIGN KEY ("destinationId") REFERENCES "destinations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Trip destination relation + snapshot fields (non-destructive)
ALTER TABLE "trips" ADD COLUMN "destinationId" TEXT;
ALTER TABLE "trips" ADD COLUMN "destinationRegionNameSnapshot" TEXT;
ALTER TABLE "trips" ADD COLUMN "destinationSource" "DestinationLocationSource";

CREATE INDEX "trips_destinationId_idx" ON "trips"("destinationId");

ALTER TABLE "trips"
  ADD CONSTRAINT "trips_destinationId_fkey"
  FOREIGN KEY ("destinationId") REFERENCES "destinations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing free-text destinations become MANUAL snapshots
UPDATE "trips"
SET "destinationSource" = 'MANUAL'
WHERE "destinationName" IS NOT NULL
  AND "destinationSource" IS NULL;
