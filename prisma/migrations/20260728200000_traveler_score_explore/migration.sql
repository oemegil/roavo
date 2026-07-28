-- CreateEnum
CREATE TYPE "TripVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'FRIENDS');

-- CreateEnum
CREATE TYPE "TravelerScoreAction" AS ENUM (
  'FLIGHT_SEARCH',
  'PLAN_PREVIEW',
  'TRIP_SAVE',
  'TRIP_LIKE_RECEIVED',
  'PHOTO_VERIFICATION'
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "travelerScoreMinor" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN "visibility" "TripVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "trips" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "trip_likes" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_score_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "TravelerScoreAction" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "tripId" TEXT,
    "referenceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traveler_score_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_travelerScoreMinor_idx" ON "users"("travelerScoreMinor");

-- CreateIndex
CREATE INDEX "trips_visibility_likeCount_updatedAt_idx" ON "trips"("visibility", "likeCount", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "trip_likes_tripId_userId_key" ON "trip_likes"("tripId", "userId");

-- CreateIndex
CREATE INDEX "trip_likes_userId_createdAt_idx" ON "trip_likes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "traveler_score_events_userId_action_createdAt_idx" ON "traveler_score_events"("userId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "traveler_score_events_userId_createdAt_idx" ON "traveler_score_events"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "traveler_score_events_userId_action_referenceKey_key" ON "traveler_score_events"("userId", "action", "referenceKey");

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_score_events" ADD CONSTRAINT "traveler_score_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
