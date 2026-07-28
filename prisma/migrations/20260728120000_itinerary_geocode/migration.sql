-- AlterTable
ALTER TABLE "itinerary_items" ADD COLUMN "latitude" DECIMAL(9,6);
ALTER TABLE "itinerary_items" ADD COLUMN "longitude" DECIMAL(9,6);

-- CreateTable
CREATE TABLE "geocode_cache" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "displayName" TEXT,
    "osmId" TEXT,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geocode_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geocode_cache_queryKey_key" ON "geocode_cache"("queryKey");
