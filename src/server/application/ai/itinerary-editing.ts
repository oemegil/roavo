import "server-only";

import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { executeStructuredAiOperation } from "@/integrations/ai/orchestrate";
import { itineraryEditPromptV1 } from "@/integrations/ai/prompts/itinerary-edit/v1";
import { itineraryDayRegenerationPromptV1 } from "@/integrations/ai/prompts/itinerary-day-regeneration/v1";
import { itineraryItemReplacementPromptV1 } from "@/integrations/ai/prompts/itinerary-item-replacement/v1";
import type {
  DayRegenerationResult,
  ItineraryEditPlan,
  ItemReplacementResult,
} from "@/integrations/ai/output-schemas";
import { AI_LIMITS } from "@/server/domain/ai/constants";
import {
  createRequestFingerprint,
  previewExpiresAt,
  summarizeText,
} from "@/server/domain/ai/fingerprint";
import { formatDateOnly } from "@/server/domain/trips/date-only";
import { hhMmToMinutes, minutesToHhMm } from "@/server/domain/trips/time-of-day";
import { requireMutableOwnedTrip } from "@/server/application/trips/get-trip";
import { toTripDetailDto } from "@/features/trips/dto";
import {
  countUserAiOperationsToday,
  createAiPreview,
  findOwnedAiPreview,
  markAiPreviewStatus,
  prisma,
} from "@/server/repositories/ai-repository";
import { tripDetailInclude } from "@/server/repositories/trip-repository";
import type { TripDetailRecord } from "@/server/repositories/trip-repository";

function assertDailyLimit(count: number) {
  if (count >= getServerEnv().AI_DAILY_OPERATION_LIMIT) {
    throw new AppError({
      code: "AI_RATE_LIMITED",
      message: "You have reached today's AI usage limit. Please try again tomorrow.",
      status: 429,
    });
  }
}

function tripContext(trip: TripDetailRecord) {
  return {
    id: trip.id,
    title: trip.title,
    destinationName: trip.destinationName,
    travelPace: trip.travelPace,
    currencyCode: trip.currencyCode,
    interests: trip.interests,
  };
}

function serializeDays(trip: TripDetailRecord) {
  return [...trip.days]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      id: day.id,
      date: formatDateOnly(day.date),
      title: day.title,
      notes: day.notes,
      items: [...day.items]
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          locationName: item.locationName,
          startTime:
            item.startMinutes != null ? minutesToHhMm(item.startMinutes) : null,
          endTime: item.endMinutes != null ? minutesToHhMm(item.endMinutes) : null,
          source: item.source,
          position: item.position,
        })),
    }));
}

function indexTrip(trip: TripDetailRecord) {
  const days = new Map(trip.days.map((day) => [day.id, day]));
  const items = new Map(
    trip.days.flatMap((day) => day.items.map((item) => [item.id, { item, day }])),
  );
  return { days, items };
}

function validateEditPlan(trip: TripDetailRecord, plan: ItineraryEditPlan, preserveManual: boolean) {
  const { days, items } = indexTrip(trip);
  const deleted = new Set<string>();
  const updated = new Set<string>();

  for (const op of plan.operations) {
    switch (op.operation) {
      case "ADD_ITEM":
        if (!days.has(op.targetDayId)) {
          throw new AppError({
            code: "AI_EDIT_INVALID",
            message: "Edit plan references an unknown day.",
            status: 422,
          });
        }
        break;
      case "UPDATE_ITEM":
      case "DELETE_ITEM":
      case "MOVE_ITEM": {
        const found = items.get(op.itemId);
        if (!found) {
          throw new AppError({
            code: "AI_EDIT_INVALID",
            message: "Edit plan references an unknown item.",
            status: 422,
          });
        }
        if (
          preserveManual &&
          found.item.source === "MANUAL" &&
          (op.operation === "DELETE_ITEM" || op.operation === "MOVE_ITEM")
        ) {
          throw new AppError({
            code: "AI_EDIT_INVALID",
            message: "Manual items are protected for this edit.",
            status: 422,
          });
        }
        if (op.operation === "DELETE_ITEM") {
          if (updated.has(op.itemId)) {
            throw new AppError({
              code: "AI_EDIT_INVALID",
              message: "Conflicting edit operations on the same item.",
              status: 422,
            });
          }
          deleted.add(op.itemId);
        }
        if (op.operation === "UPDATE_ITEM") {
          if (deleted.has(op.itemId)) {
            throw new AppError({
              code: "AI_EDIT_INVALID",
              message: "Conflicting edit operations on the same item.",
              status: 422,
            });
          }
          updated.add(op.itemId);
        }
        if (op.operation === "MOVE_ITEM" && !days.has(op.targetDayId)) {
          throw new AppError({
            code: "AI_EDIT_INVALID",
            message: "Edit plan moves an item to an unknown day.",
            status: 422,
          });
        }
        break;
      }
      case "REORDER_ITEMS":
      case "UPDATE_DAY":
      case "REPLACE_DAY_ITEMS": {
        if (!days.has(op.dayId ?? (op as { dayId: string }).dayId)) {
          throw new AppError({
            code: "AI_EDIT_INVALID",
            message: "Edit plan references an unknown day.",
            status: 422,
          });
        }
        if (op.operation === "REPLACE_DAY_ITEMS" && preserveManual) {
          const day = days.get(op.dayId)!;
          for (const item of day.items) {
            if (item.source === "MANUAL" && !op.preservedItemIds.includes(item.id)) {
              throw new AppError({
                code: "AI_EDIT_INVALID",
                message: "Manual items must be preserved for this day regeneration.",
                status: 422,
              });
            }
          }
        }
        if (op.operation === "REORDER_ITEMS") {
          const day = days.get(op.dayId)!;
          const currentIds = day.items.map((item) => item.id).sort();
          const ordered = [...op.orderedItemIds].sort();
          if (
            currentIds.length !== ordered.length ||
            currentIds.some((id, idx) => id !== ordered[idx])
          ) {
            throw new AppError({
              code: "AI_EDIT_INVALID",
              message: "Reorder list must include exactly the day's current items.",
              status: 422,
            });
          }
        }
        break;
      }
    }
  }
}

async function applyEditPlan(
  trip: TripDetailRecord,
  plan: ItineraryEditPlan,
) {
  await prisma.$transaction(async (tx) => {
    for (const op of plan.operations) {
      switch (op.operation) {
        case "ADD_ITEM": {
          const count = await tx.itineraryItem.count({
            where: { tripDayId: op.targetDayId },
          });
          await tx.itineraryItem.create({
            data: {
              tripDayId: op.targetDayId,
              type: op.item.type,
              title: op.item.title,
              description: op.item.description ?? null,
              locationName: op.item.locationName ?? null,
              startMinutes: op.item.startTime
                ? hhMmToMinutes(op.item.startTime)
                : null,
              endMinutes: op.item.endTime ? hhMmToMinutes(op.item.endTime) : null,
              durationMinutes: op.item.durationMinutes ?? null,
              estimatedCostMinor: op.item.estimatedCostMinor ?? null,
              currencyCode: op.item.currencyCode ?? trip.currencyCode,
              transportationMode: op.item.transportationMode ?? null,
              notes: op.item.notes ?? null,
              position: count,
              source: "AI_GENERATED",
            },
          });
          break;
        }
        case "UPDATE_ITEM": {
          const changes = op.changes;
          await tx.itineraryItem.update({
            where: { id: op.itemId },
            data: {
              ...(changes.type ? { type: changes.type } : {}),
              ...(changes.title ? { title: changes.title } : {}),
              ...(changes.description !== undefined
                ? { description: changes.description }
                : {}),
              ...(changes.locationName !== undefined
                ? { locationName: changes.locationName }
                : {}),
              ...(changes.startTime !== undefined
                ? {
                    startMinutes: changes.startTime
                      ? hhMmToMinutes(changes.startTime)
                      : null,
                  }
                : {}),
              ...(changes.endTime !== undefined
                ? {
                    endMinutes: changes.endTime
                      ? hhMmToMinutes(changes.endTime)
                      : null,
                  }
                : {}),
              ...(changes.durationMinutes !== undefined
                ? { durationMinutes: changes.durationMinutes }
                : {}),
              ...(changes.estimatedCostMinor !== undefined
                ? { estimatedCostMinor: changes.estimatedCostMinor }
                : {}),
              ...(changes.currencyCode !== undefined
                ? { currencyCode: changes.currencyCode }
                : {}),
              ...(changes.transportationMode !== undefined
                ? { transportationMode: changes.transportationMode }
                : {}),
              ...(changes.notes !== undefined ? { notes: changes.notes } : {}),
              source: "AI_MODIFIED",
            },
          });
          break;
        }
        case "DELETE_ITEM":
          await tx.itineraryItem.delete({ where: { id: op.itemId } });
          break;
        case "MOVE_ITEM": {
          await tx.itineraryItem.update({
            where: { id: op.itemId },
            data: {
              tripDayId: op.targetDayId,
              position: op.targetIndex,
              source: "AI_MODIFIED",
            },
          });
          break;
        }
        case "REORDER_ITEMS":
          for (let i = 0; i < op.orderedItemIds.length; i += 1) {
            await tx.itineraryItem.update({
              where: { id: op.orderedItemIds[i]! },
              data: { position: i },
            });
          }
          break;
        case "UPDATE_DAY":
          await tx.tripDay.update({
            where: { id: op.dayId },
            data: {
              ...(op.changes.title !== undefined ? { title: op.changes.title } : {}),
              ...(op.changes.notes !== undefined ? { notes: op.changes.notes } : {}),
            },
          });
          break;
        case "REPLACE_DAY_ITEMS": {
          const dayItems = await tx.itineraryItem.findMany({
            where: { tripDayId: op.dayId },
          });
          for (const item of dayItems) {
            if (!op.preservedItemIds.includes(item.id)) {
              await tx.itineraryItem.delete({ where: { id: item.id } });
            }
          }
          let position = op.preservedItemIds.length;
          for (const item of op.replacementItems) {
            await tx.itineraryItem.create({
              data: {
                tripDayId: op.dayId,
                type: item.type,
                title: item.title,
                description: item.description ?? null,
                locationName: item.locationName ?? null,
                startMinutes: item.startTime
                  ? hhMmToMinutes(item.startTime)
                  : null,
                endMinutes: item.endTime ? hhMmToMinutes(item.endTime) : null,
                durationMinutes: item.durationMinutes ?? null,
                estimatedCostMinor: item.estimatedCostMinor ?? null,
                currencyCode: item.currencyCode ?? trip.currencyCode,
                transportationMode: item.transportationMode ?? null,
                notes: item.notes ?? null,
                position,
                source: "AI_GENERATED",
              },
            });
            position += 1;
          }
          break;
        }
      }
    }
  });
}

export async function generateItineraryEditPreviewService(input: {
  userId: string;
  tripId: string;
  instruction: string;
  scope: { type: "trip" } | { type: "day"; dayId: string } | { type: "item"; itemId: string };
  preserveManualItems: boolean;
  expectedTripVersion: string;
  correlationId?: string;
  signal?: AbortSignal;
}) {
  assertDailyLimit(await countUserAiOperationsToday(input.userId));
  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });
  if (trip.updatedAt.toISOString() !== input.expectedTripVersion) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed elsewhere. Reload and try again.",
      status: 409,
    });
  }

  const days = serializeDays(trip);
  const executed = await executeStructuredAiOperation({
    userId: input.userId,
    tripId: trip.id,
    prompt: itineraryEditPromptV1,
    promptInput: {
      instruction: input.instruction,
      preserveManualItems: input.preserveManualItems,
      scope: input.scope,
      trip: tripContext(trip),
      days,
    },
    inputSummary: {
      tripId: trip.id,
      instructionLength: input.instruction.length,
      scopeType: input.scope.type,
      preserveManualItems: input.preserveManualItems,
    },
    requestFingerprint: createRequestFingerprint({
      op: "ITINERARY_EDIT",
      tripId: trip.id,
      version: input.expectedTripVersion,
      instruction: input.instruction,
    }),
    domainValidate: (plan) =>
      validateEditPlan(trip, plan, input.preserveManualItems),
    correlationId: input.correlationId,
    signal: input.signal,
  });

  const expiresAt = previewExpiresAt(AI_LIMITS.previewTtlHours);
  const preview = await createAiPreview({
    aiOperationId: executed.operationId,
    userId: input.userId,
    tripId: trip.id,
    kind: "ITINERARY_EDIT",
    tripVersion: input.expectedTripVersion,
    instructionSummary: summarizeText(input.instruction, 120),
    validatedPayload: executed.output,
    beforeSummary: {
      itemCount: trip.days.reduce((s, d) => s + d.items.length, 0),
    },
    afterSummary: { operationCount: executed.output.operations.length },
    warnings: executed.output.warnings,
    expiresAt,
  });

  return {
    operationId: executed.operationId,
    previewId: preview.id,
    promptVersion: executed.promptVersion,
    summary: executed.output.summary,
    operations: executed.output.operations,
    warnings: executed.output.warnings,
    beforeSummary: { itemCount: trip.days.reduce((s, d) => s + d.items.length, 0) },
    afterSummary: { operationCount: executed.output.operations.length },
    expiresAt: expiresAt.toISOString(),
    disclaimer: "Proposed AI changes — review before applying.",
  };
}

export async function applyItineraryEditPreviewService(input: {
  userId: string;
  tripId: string;
  previewId: string;
  expectedTripVersion?: string;
}) {
  const preview = await findOwnedAiPreview(input.previewId, input.userId);
  if (!preview || preview.tripId !== input.tripId) {
    throw new AppError({
      code: "AI_OPERATION_NOT_FOUND",
      message: "Edit preview was not found.",
      status: 404,
    });
  }
  if (preview.status !== "PENDING") {
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "This preview was already applied or discarded.",
      status: 409,
    });
  }
  if (preview.expiresAt.getTime() < Date.now()) {
    await markAiPreviewStatus(preview.id, "EXPIRED");
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "This preview has expired.",
      status: 409,
    });
  }

  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });
  const expected = input.expectedTripVersion ?? preview.tripVersion;
  if (trip.updatedAt.toISOString() !== expected) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed after the preview was created.",
      status: 409,
    });
  }

  const plan = preview.validatedPayload as ItineraryEditPlan;
  validateEditPlan(trip, plan, true);
  try {
    await applyEditPlan(trip, plan);
    await markAiPreviewStatus(preview.id, "APPLIED");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "AI_PERSISTENCE_FAILED",
      message: "We couldn't apply the AI edit.",
      status: 500,
      cause: error,
    });
  }

  const updated = await prisma.trip.findFirstOrThrow({
    where: { id: trip.id },
    include: tripDetailInclude,
  });
  return { trip: toTripDetailDto(updated), previewId: preview.id };
}

export async function discardItineraryEditPreviewService(input: {
  userId: string;
  tripId: string;
  previewId: string;
}) {
  const preview = await findOwnedAiPreview(input.previewId, input.userId);
  if (!preview || preview.tripId !== input.tripId) {
    throw new AppError({
      code: "AI_OPERATION_NOT_FOUND",
      message: "Edit preview was not found.",
      status: 404,
    });
  }
  if (preview.status === "APPLIED") {
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "Applied previews cannot be discarded.",
      status: 409,
    });
  }
  await markAiPreviewStatus(preview.id, "DISCARDED");
  return { discarded: true, previewId: preview.id };
}

export async function regenerateTripDayService(input: {
  userId: string;
  tripId: string;
  dayId: string;
  instruction?: string;
  preserveManualItems: boolean;
  expectedTripVersion: string;
  correlationId?: string;
  signal?: AbortSignal;
}) {
  assertDailyLimit(await countUserAiOperationsToday(input.userId));
  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });
  if (trip.updatedAt.toISOString() !== input.expectedTripVersion) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed elsewhere. Reload and try again.",
      status: 409,
    });
  }
  const day = trip.days.find((d) => d.id === input.dayId);
  if (!day) {
    throw new AppError({
      code: "TRIP_DAY_NOT_FOUND",
      message: "Trip day not found.",
      status: 404,
    });
  }

  const days = serializeDays(trip);
  const dayIndex = days.findIndex((d) => d.id === day.id);
  const neighbors = {
    previous: dayIndex > 0 ? days[dayIndex - 1] : null,
    next: dayIndex < days.length - 1 ? days[dayIndex + 1] : null,
  };

  const executed = await executeStructuredAiOperation({
    userId: input.userId,
    tripId: trip.id,
    prompt: itineraryDayRegenerationPromptV1,
    promptInput: {
      instruction: input.instruction,
      preserveManualItems: input.preserveManualItems,
      trip: tripContext(trip),
      day: days[dayIndex],
      neighbors,
    },
    inputSummary: {
      tripId: trip.id,
      dayId: day.id,
      preserveManualItems: input.preserveManualItems,
    },
    requestFingerprint: createRequestFingerprint({
      op: "ITINERARY_DAY_REGENERATION",
      tripId: trip.id,
      dayId: day.id,
      version: input.expectedTripVersion,
    }),
    domainValidate: (result: DayRegenerationResult) => {
      if (result.dayId !== day.id) {
        throw new AppError({
          code: "AI_DOMAIN_VALIDATION_FAILED",
          message: "Day regeneration targeted the wrong day.",
          status: 422,
        });
      }
      if (input.preserveManualItems) {
        for (const item of day.items) {
          if (item.source === "MANUAL" && !result.preservedItemIds.includes(item.id)) {
            throw new AppError({
              code: "AI_EDIT_INVALID",
              message: "Manual items must remain preserved.",
              status: 422,
            });
          }
        }
      }
    },
    correlationId: input.correlationId,
    signal: input.signal,
  });

  const plan: ItineraryEditPlan = {
    summary: executed.output.summary,
    warnings: executed.output.warnings,
    operations: [
      {
        operation: "REPLACE_DAY_ITEMS",
        dayId: day.id,
        preservedItemIds: executed.output.preservedItemIds,
        replacementItems: executed.output.replacementItems,
        reason: executed.output.summary,
      },
      ...(executed.output.theme || executed.output.notes
        ? [
            {
              operation: "UPDATE_DAY" as const,
              dayId: day.id,
              changes: {
                title: executed.output.theme,
                notes: executed.output.notes,
              },
              reason: "Updated day theme/notes",
            },
          ]
        : []),
    ],
  };

  const expiresAt = previewExpiresAt(AI_LIMITS.previewTtlHours);
  const preview = await createAiPreview({
    aiOperationId: executed.operationId,
    userId: input.userId,
    tripId: trip.id,
    kind: "DAY_REGENERATION",
    tripVersion: input.expectedTripVersion,
    instructionSummary: summarizeText(input.instruction, 120),
    validatedPayload: plan,
    warnings: executed.output.warnings,
    expiresAt,
  });

  return {
    operationId: executed.operationId,
    previewId: preview.id,
    summary: executed.output.summary,
    operations: plan.operations,
    warnings: executed.output.warnings,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function replaceItineraryItemService(input: {
  userId: string;
  tripId: string;
  itemId: string;
  instruction: string;
  expectedTripVersion: string;
  correlationId?: string;
  signal?: AbortSignal;
}) {
  assertDailyLimit(await countUserAiOperationsToday(input.userId));
  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });
  if (trip.updatedAt.toISOString() !== input.expectedTripVersion) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed elsewhere. Reload and try again.",
      status: 409,
    });
  }

  const days = serializeDays(trip);
  const day = days.find((d) => d.items.some((item) => item.id === input.itemId));
  const item = day?.items.find((entry) => entry.id === input.itemId);
  if (!day || !item) {
    throw new AppError({
      code: "ITINERARY_ITEM_NOT_FOUND",
      message: "Itinerary item not found.",
      status: 404,
    });
  }

  const executed = await executeStructuredAiOperation({
    userId: input.userId,
    tripId: trip.id,
    prompt: itineraryItemReplacementPromptV1,
    promptInput: {
      instruction: input.instruction,
      trip: tripContext(trip),
      day,
      item,
      neighbors: day.items.filter((entry) => entry.id !== item.id),
    },
    inputSummary: {
      tripId: trip.id,
      itemId: item.id,
      instructionLength: input.instruction.length,
    },
    requestFingerprint: createRequestFingerprint({
      op: "ITINERARY_ITEM_REPLACEMENT",
      tripId: trip.id,
      itemId: item.id,
      version: input.expectedTripVersion,
    }),
    domainValidate: (result: ItemReplacementResult) => {
      if (result.itemId !== item.id) {
        throw new AppError({
          code: "AI_DOMAIN_VALIDATION_FAILED",
          message: "Replacement targeted the wrong item.",
          status: 422,
        });
      }
    },
    correlationId: input.correlationId,
    signal: input.signal,
  });

  const plan: ItineraryEditPlan = {
    summary: executed.output.summary,
    warnings: executed.output.warnings,
    operations: [
      {
        operation: "UPDATE_ITEM",
        itemId: item.id,
        changes: {
          type: executed.output.replacement.type,
          title: executed.output.replacement.title,
          description: executed.output.replacement.description ?? null,
          locationName: executed.output.replacement.locationName ?? null,
          startTime: executed.output.replacement.startTime ?? null,
          endTime: executed.output.replacement.endTime ?? null,
          durationMinutes: executed.output.replacement.durationMinutes ?? null,
          estimatedCostMinor: executed.output.replacement.estimatedCostMinor ?? null,
          currencyCode: executed.output.replacement.currencyCode ?? null,
          transportationMode:
            executed.output.replacement.transportationMode ?? null,
          notes: executed.output.replacement.notes ?? null,
        },
        reason: executed.output.reason,
      },
    ],
  };

  const expiresAt = previewExpiresAt(AI_LIMITS.previewTtlHours);
  const preview = await createAiPreview({
    aiOperationId: executed.operationId,
    userId: input.userId,
    tripId: trip.id,
    kind: "ITEM_REPLACEMENT",
    tripVersion: input.expectedTripVersion,
    instructionSummary: summarizeText(input.instruction, 120),
    validatedPayload: plan,
    warnings: executed.output.warnings,
    expiresAt,
  });

  return {
    operationId: executed.operationId,
    previewId: preview.id,
    summary: executed.output.summary,
    operations: plan.operations,
    warnings: executed.output.warnings,
    expiresAt: expiresAt.toISOString(),
  };
}
