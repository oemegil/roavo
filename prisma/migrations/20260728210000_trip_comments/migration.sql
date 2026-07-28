-- AlterTable
ALTER TABLE "trips" ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "trip_comments" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trip_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_comments_tripId_createdAt_idx" ON "trip_comments"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "trip_comments_userId_createdAt_idx" ON "trip_comments"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "trip_comments" ADD CONSTRAINT "trip_comments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_comments" ADD CONSTRAINT "trip_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
