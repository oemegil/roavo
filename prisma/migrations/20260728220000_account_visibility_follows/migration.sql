-- Account visibility + follow graph
CREATE TYPE "AccountVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "FollowStatus" AS ENUM ('PENDING', 'ACTIVE');

ALTER TABLE "users" ADD COLUMN "accountVisibility" "AccountVisibility" NOT NULL DEFAULT 'PRIVATE';

CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "status" "FollowStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_follows_followerId_followingId_key" ON "user_follows"("followerId", "followingId");
CREATE INDEX "user_follows_followingId_status_createdAt_idx" ON "user_follows"("followingId", "status", "createdAt");
CREATE INDEX "user_follows_followerId_status_createdAt_idx" ON "user_follows"("followerId", "status", "createdAt");
CREATE INDEX "users_accountVisibility_idx" ON "users"("accountVisibility");

ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
