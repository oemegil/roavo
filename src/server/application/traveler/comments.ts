import "server-only";

import {
  COMMENT_DAILY_LIMIT,
  type CreateTripCommentInput,
} from "@/features/traveler/schemas";
import { AppError } from "@/lib/errors";
import { prisma } from "@/server/infrastructure/database";

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function requirePublicTrip(tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      deletedAt: null,
      status: "DRAFT",
      visibility: "PUBLIC",
    },
    select: { id: true, ownerId: true, commentCount: true },
  });
  if (!trip) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Public gezi bulunamadı.",
      status: 404,
    });
  }
  return trip;
}

function toCommentDto(
  comment: {
    id: string;
    body: string;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      profile: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
      } | null;
    };
  },
  viewerId?: string | null,
  tripOwnerId?: string,
) {
  const canDelete =
    Boolean(viewerId) && (comment.userId === viewerId || tripOwnerId === viewerId);
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    canDelete,
    author: {
      id: comment.user.id,
      username: comment.user.profile?.username ?? "gezgin",
      displayName: comment.user.profile?.displayName ?? "Gezgin",
      avatarUrl: comment.user.profile?.avatarUrl ?? null,
    },
  };
}

const commentAuthorInclude = {
  user: {
    select: {
      id: true,
      profile: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const;

export async function listTripComments(input: {
  tripId: string;
  viewerId?: string | null;
  cursor?: string;
  limit?: number;
}) {
  const trip = await requirePublicTrip(input.tripId);
  const limit = Math.min(input.limit ?? 20, 50);

  let cursorFilter: { createdAt: Date; id: string } | null = null;
  if (input.cursor) {
    const cursorComment = await prisma.tripComment.findFirst({
      where: { id: input.cursor, tripId: trip.id, deletedAt: null },
      select: { id: true, createdAt: true },
    });
    if (cursorComment) {
      cursorFilter = {
        id: cursorComment.id,
        createdAt: cursorComment.createdAt,
      };
    }
  }

  const comments = await prisma.tripComment.findMany({
    where: {
      tripId: trip.id,
      deletedAt: null,
      ...(cursorFilter
        ? {
            OR: [
              { createdAt: { lt: cursorFilter.createdAt } },
              {
                createdAt: cursorFilter.createdAt,
                id: { lt: cursorFilter.id },
              },
            ],
          }
        : {}),
    },
    include: commentAuthorInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const page = comments.slice(0, limit);
  const nextCursor = comments.length > limit ? page[page.length - 1]?.id : null;

  return {
    comments: page.map((comment) => toCommentDto(comment, input.viewerId, trip.ownerId)),
    commentCount: trip.commentCount,
    nextCursor,
  };
}

export async function createTripComment(input: {
  userId: string;
  tripId: string;
  data: CreateTripCommentInput;
}) {
  const trip = await requirePublicTrip(input.tripId);
  const body = input.data.body.trim();
  if (!body) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Yorum boş olamaz.",
      status: 400,
    });
  }

  const todayCount = await prisma.tripComment.count({
    where: {
      userId: input.userId,
      createdAt: { gte: startOfUtcDay() },
    },
  });
  if (todayCount >= COMMENT_DAILY_LIMIT) {
    throw new AppError({
      code: "RATE_LIMITED",
      message: "Bugünkü yorum limitine ulaştın. Yarın tekrar dene.",
      status: 429,
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.tripComment.create({
      data: {
        tripId: trip.id,
        userId: input.userId,
        body,
      },
      include: commentAuthorInclude,
    });
    await tx.trip.update({
      where: { id: trip.id },
      data: { commentCount: { increment: 1 } },
    });
    return comment;
  });

  const updated = await prisma.trip.findUniqueOrThrow({
    where: { id: trip.id },
    select: { commentCount: true },
  });

  return {
    comment: toCommentDto(created, input.userId, trip.ownerId),
    commentCount: updated.commentCount,
  };
}

export async function deleteTripComment(input: {
  userId: string;
  tripId: string;
  commentId: string;
}) {
  const trip = await requirePublicTrip(input.tripId);
  const comment = await prisma.tripComment.findFirst({
    where: {
      id: input.commentId,
      tripId: trip.id,
      deletedAt: null,
    },
  });
  if (!comment) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Yorum bulunamadı.",
      status: 404,
    });
  }

  const canDelete = comment.userId === input.userId || trip.ownerId === input.userId;
  if (!canDelete) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Bu yorumu silemezsin.",
      status: 403,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tripComment.update({
      where: { id: comment.id },
      data: { deletedAt: new Date() },
    });
    return tx.trip.update({
      where: { id: trip.id },
      data: { commentCount: { decrement: 1 } },
      select: { commentCount: true },
    });
  });

  const commentCount = Math.max(0, updated.commentCount);
  if (updated.commentCount < 0) {
    await prisma.trip.update({
      where: { id: trip.id },
      data: { commentCount: 0 },
    });
  }

  return { deleted: true as const, commentCount };
}
