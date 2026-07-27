-- AI travel planning foundation

CREATE TYPE "AiOperationType" AS ENUM (
  'DESTINATION_RECOMMENDATION',
  'ITINERARY_GENERATION',
  'ITINERARY_DAY_REGENERATION',
  'ITINERARY_ITEM_REPLACEMENT',
  'ITINERARY_EDIT',
  'ITINERARY_REPAIR',
  'OUTPUT_SCHEMA_REPAIR'
);

CREATE TYPE "AiOperationStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_SUCCEEDED'
);

CREATE TYPE "AiPreviewKind" AS ENUM (
  'ITINERARY_GENERATION',
  'ITINERARY_EDIT',
  'DAY_REGENERATION',
  'ITEM_REPLACEMENT'
);

CREATE TYPE "AiPreviewStatus" AS ENUM (
  'PENDING',
  'APPLIED',
  'DISCARDED',
  'EXPIRED'
);

CREATE TABLE "ai_operations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT,
    "type" "AiOperationType" NOT NULL,
    "status" "AiOperationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "requestFingerprint" TEXT,
    "inputSummary" JSONB,
    "outputSummary" JSONB,
    "providerRequestId" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostMinor" INTEGER,
    "costCurrencyCode" TEXT DEFAULT 'USD',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_operations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_operations_userId_type_createdAt_idx" ON "ai_operations"("userId", "type", "createdAt");
CREATE INDEX "ai_operations_tripId_status_idx" ON "ai_operations"("tripId", "status");
CREATE INDEX "ai_operations_status_createdAt_idx" ON "ai_operations"("status", "createdAt");
CREATE INDEX "ai_operations_requestFingerprint_idx" ON "ai_operations"("requestFingerprint");

ALTER TABLE "ai_operations"
  ADD CONSTRAINT "ai_operations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_operations"
  ADD CONSTRAINT "ai_operations_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "destination_recommendations" (
    "id" TEXT NOT NULL,
    "aiOperationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "destination_recommendations_aiOperationId_key" ON "destination_recommendations"("aiOperationId");
CREATE INDEX "destination_recommendations_userId_createdAt_idx" ON "destination_recommendations"("userId", "createdAt");
CREATE INDEX "destination_recommendations_expiresAt_idx" ON "destination_recommendations"("expiresAt");

ALTER TABLE "destination_recommendations"
  ADD CONSTRAINT "destination_recommendations_aiOperationId_fkey"
  FOREIGN KEY ("aiOperationId") REFERENCES "ai_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "destination_recommendations"
  ADD CONSTRAINT "destination_recommendations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_previews" (
    "id" TEXT NOT NULL,
    "aiOperationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "kind" "AiPreviewKind" NOT NULL,
    "status" "AiPreviewStatus" NOT NULL DEFAULT 'PENDING',
    "tripVersion" TEXT NOT NULL,
    "instructionSummary" TEXT,
    "validatedPayload" JSONB NOT NULL,
    "beforeSummary" JSONB,
    "afterSummary" JSONB,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_previews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_previews_userId_tripId_status_idx" ON "ai_previews"("userId", "tripId", "status");
CREATE INDEX "ai_previews_tripId_status_idx" ON "ai_previews"("tripId", "status");
CREATE INDEX "ai_previews_expiresAt_idx" ON "ai_previews"("expiresAt");

ALTER TABLE "ai_previews"
  ADD CONSTRAINT "ai_previews_aiOperationId_fkey"
  FOREIGN KEY ("aiOperationId") REFERENCES "ai_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_previews"
  ADD CONSTRAINT "ai_previews_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_previews"
  ADD CONSTRAINT "ai_previews_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
