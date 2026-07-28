import "server-only";

import type { TravelerScoreAction } from "@prisma/client";

import { getServerEnv } from "@/lib/env/server";
import { createRequestLogger } from "@/lib/logging/logger";
import { prisma } from "@/server/infrastructure/database";
import {
  TRAVELER_SCORE_AMOUNTS_MINOR,
  pointsFromMinor,
} from "@/server/domain/traveler/score";

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dailyCapForAction(action: TravelerScoreAction): number {
  const env = getServerEnv();
  switch (action) {
    case "FLIGHT_SEARCH":
      return env.TRAVELER_SCORE_FLIGHT_DAILY_CAP;
    case "PLAN_PREVIEW":
      return env.TRAVELER_SCORE_PREVIEW_DAILY_CAP;
    case "TRIP_LIKE_RECEIVED":
      return env.TRAVELER_SCORE_LIKE_DAILY_CAP;
    default:
      return 0; // 0 = no daily cap (once-per-reference still applies)
  }
}

function amountForAction(action: TravelerScoreAction): number {
  if (action === "TRIP_LIKE_RECEIVED") {
    return getServerEnv().TRAVELER_SCORE_LIKE_AMOUNT_MINOR;
  }
  return TRAVELER_SCORE_AMOUNTS_MINOR[action];
}

export type AwardScoreResult = {
  awarded: boolean;
  amountMinor: number;
  newScoreMinor: number;
  reason?: "daily_cap" | "duplicate" | "disabled" | "reserved";
};

/**
 * Award traveler score. Never throws on duplicate/cap — returns awarded:false.
 * PHOTO_VERIFICATION is reserved and never awards in v1.
 */
export async function awardTravelerScore(input: {
  userId: string;
  action: TravelerScoreAction;
  tripId?: string | null;
  referenceKey?: string | null;
  correlationId?: string;
}): Promise<AwardScoreResult> {
  const log = createRequestLogger(input.correlationId ?? "traveler-score");

  if (input.action === "PHOTO_VERIFICATION") {
    return {
      awarded: false,
      amountMinor: 0,
      newScoreMinor: 0,
      reason: "reserved",
    };
  }

  const amountMinor = amountForAction(input.action);
  if (amountMinor <= 0) {
    return { awarded: false, amountMinor: 0, newScoreMinor: 0, reason: "disabled" };
  }

  const dailyCap = dailyCapForAction(input.action);
  // dailyCap > 0 enforces a per-day limit; 0 means unlimited for that action.
  if (dailyCap > 0) {
    const since = startOfUtcDay();
    const todayCount = await prisma.travelerScoreEvent.count({
      where: {
        userId: input.userId,
        action: input.action,
        createdAt: { gte: since },
      },
    });
    if (todayCount >= dailyCap) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { travelerScoreMinor: true },
      });
      return {
        awarded: false,
        amountMinor: 0,
        newScoreMinor: user?.travelerScoreMinor ?? 0,
        reason: "daily_cap",
      };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.travelerScoreEvent.create({
        data: {
          userId: input.userId,
          action: input.action,
          amountMinor,
          tripId: input.tripId ?? null,
          referenceKey: input.referenceKey ?? null,
        },
      });
      const updated = await tx.user.update({
        where: { id: input.userId },
        data: { travelerScoreMinor: { increment: amountMinor } },
        select: { travelerScoreMinor: true },
      });
      return updated.travelerScoreMinor;
    });

    log.info("Traveler score awarded", {
      userId: input.userId,
      action: input.action,
      amountMinor,
      points: pointsFromMinor(amountMinor),
      newScore: pointsFromMinor(result),
    });

    return { awarded: true, amountMinor, newScoreMinor: result };
  } catch (error) {
    // Unique constraint on (userId, action, referenceKey)
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { travelerScoreMinor: true },
    });
    log.info("Traveler score skipped (duplicate or error)", {
      userId: input.userId,
      action: input.action,
      referenceKey: input.referenceKey ?? null,
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      awarded: false,
      amountMinor: 0,
      newScoreMinor: user?.travelerScoreMinor ?? 0,
      reason: "duplicate",
    };
  }
}
