-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TravelPace" AS ENUM ('RELAXED', 'BALANCED', 'FAST_PACED');

-- CreateEnum
CREATE TYPE "ItineraryItemType" AS ENUM ('ATTRACTION', 'RESTAURANT', 'CAFE', 'TRANSPORTATION', 'ACCOMMODATION', 'SHOPPING', 'NIGHTLIFE', 'FREE_TIME', 'NOTE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ItineraryItemSource" AS ENUM ('MANUAL', 'AI_GENERATED', 'AI_MODIFIED', 'CLONED');

-- CreateEnum
CREATE TYPE "TransportationMode" AS ENUM ('WALK', 'PUBLIC_TRANSIT', 'TAXI', 'CAR', 'BICYCLE', 'TRAIN', 'FLIGHT', 'FERRY', 'OTHER');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "originName" TEXT NOT NULL,
    "originCountryCode" TEXT,
    "originPlaceId" TEXT,
    "destinationName" TEXT,
    "destinationCountryCode" TEXT,
    "destinationPlaceId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "travelerCount" INTEGER NOT NULL DEFAULT 1,
    "totalBudgetMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "travelPace" "TravelPace" NOT NULL DEFAULT 'BALANCED',
    "destinationTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryNotes" TEXT,
    "accessibilityNotes" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_items" (
    "id" TEXT NOT NULL,
    "tripDayId" TEXT NOT NULL,
    "type" "ItineraryItemType" NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationName" TEXT,
    "externalPlaceId" TEXT,
    "startMinutes" INTEGER,
    "endMinutes" INTEGER,
    "durationMinutes" INTEGER,
    "estimatedCostMinor" INTEGER,
    "currencyCode" TEXT,
    "transportationMode" "TransportationMode",
    "notes" TEXT,
    "position" INTEGER NOT NULL,
    "source" "ItineraryItemSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_ownerId_status_updatedAt_idx" ON "trips"("ownerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "trips_ownerId_deletedAt_updatedAt_idx" ON "trips"("ownerId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "trip_days_tripId_position_idx" ON "trip_days"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "trip_days_tripId_date_key" ON "trip_days"("tripId", "date");

-- CreateIndex
CREATE INDEX "itinerary_items_tripDayId_position_idx" ON "itinerary_items"("tripDayId", "position");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "trip_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
