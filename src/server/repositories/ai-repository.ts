import "server-only";

import type {
  AiOperationStatus,
  AiOperationType,
  AiPreviewKind,
  AiPreviewStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/server/infrastructure/database";

export async function createAiOperation(input: {
  userId: string;
  tripId?: string | null;
  type: AiOperationType;
  provider: string;
  model: string;
  promptKey: string;
  promptVersion: string;
  requestFingerprint?: string;
  inputSummary?: Prisma.InputJsonValue;
}) {
  return prisma.aiOperation.create({
    data: {
      userId: input.userId,
      tripId: input.tripId ?? null,
      type: input.type,
      status: "PENDING",
      provider: input.provider,
      model: input.model,
      promptKey: input.promptKey,
      promptVersion: input.promptVersion,
      requestFingerprint: input.requestFingerprint,
      inputSummary: input.inputSummary,
    },
  });
}

export async function markAiOperationRunning(id: string) {
  return prisma.aiOperation.update({
    where: { id },
    data: { status: "RUNNING", startedAt: new Date() },
  });
}

export async function completeAiOperation(input: {
  id: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostMinor: number | null;
  retryCount: number;
  outputSummary?: Prisma.InputJsonValue;
  status?: AiOperationStatus;
}) {
  return prisma.aiOperation.update({
    where: { id: input.id },
    data: {
      status: input.status ?? "SUCCEEDED",
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.totalTokens,
      estimatedCostMinor: input.estimatedCostMinor,
      retryCount: input.retryCount,
      outputSummary: input.outputSummary,
      completedAt: new Date(),
    },
  });
}

export async function failAiOperation(input: {
  id: string;
  errorCode: string;
  retryCount: number;
  outputSummary?: Prisma.InputJsonValue;
}) {
  return prisma.aiOperation.update({
    where: { id: input.id },
    data: {
      status: "FAILED",
      errorCode: input.errorCode,
      retryCount: input.retryCount,
      ...(input.outputSummary !== undefined
        ? { outputSummary: input.outputSummary }
        : {}),
      failedAt: new Date(),
      completedAt: new Date(),
    },
  });
}

export async function findOwnedAiOperation(id: string, userId: string) {
  return prisma.aiOperation.findFirst({
    where: { id, userId },
    include: {
      destinationRecommendation: true,
      previews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function createDestinationRecommendation(input: {
  aiOperationId: string;
  userId: string;
  requestSnapshot: Prisma.InputJsonValue;
  resultSnapshot: Prisma.InputJsonValue;
  expiresAt: Date;
}) {
  return prisma.destinationRecommendation.create({
    data: input,
  });
}

export async function findOwnedDestinationRecommendationByOperation(
  operationId: string,
  userId: string,
) {
  return prisma.destinationRecommendation.findFirst({
    where: { aiOperationId: operationId, userId },
    include: { aiOperation: true },
  });
}

export async function createAiPreview(input: {
  aiOperationId: string;
  userId: string;
  tripId: string;
  kind: AiPreviewKind;
  tripVersion: string;
  instructionSummary?: string | null;
  validatedPayload: Prisma.InputJsonValue;
  beforeSummary?: Prisma.InputJsonValue;
  afterSummary?: Prisma.InputJsonValue;
  warnings?: string[];
  expiresAt: Date;
}) {
  return prisma.aiPreview.create({
    data: {
      ...input,
      status: "PENDING",
      warnings: input.warnings ?? [],
    },
  });
}

export async function findOwnedAiPreview(previewId: string, userId: string) {
  return prisma.aiPreview.findFirst({
    where: { id: previewId, userId },
    include: { aiOperation: true },
  });
}

export async function markAiPreviewStatus(
  previewId: string,
  status: AiPreviewStatus,
) {
  return prisma.aiPreview.update({
    where: { id: previewId },
    data: {
      status,
      appliedAt: status === "APPLIED" ? new Date() : undefined,
    },
  });
}

export async function countUserAiOperationsToday(userId: string) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return prisma.aiOperation.count({
    where: {
      userId,
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
  });
}

export { prisma };
