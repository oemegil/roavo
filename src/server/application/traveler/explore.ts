import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/server/infrastructure/database";
import { awardTravelerScore } from "@/server/application/traveler/award-score";
import {
  exploreRankScore,
  pointsFromMinor,
  primaryBadgeForScore,
} from "@/server/domain/traveler/score";
import { formatDateOnly } from "@/server/domain/trips/date-only";
import { resolveAccountAccess } from "@/server/domain/traveler/visibility";

export async function likePublicTrip(input: {
  userId: string;
  tripId: string;
  correlationId?: string;
}) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: input.tripId,
      deletedAt: null,
      status: "DRAFT",
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      ownerId: true,
      owner: { select: { accountVisibility: true } },
    },
  });
  if (!trip) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Public gezi bulunamadı.",
      status: 404,
    });
  }
  if (trip.ownerId === input.userId) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Kendi gezini beğenemezsin.",
      status: 400,
    });
  }

  const access = await resolveAccountAccess({
    viewerId: input.userId,
    ownerId: trip.ownerId,
    accountVisibility: trip.owner.accountVisibility,
  });
  if (!access.canViewContent) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Public gezi bulunamadı.",
      status: 404,
    });
  }

  try {
    const like = await prisma.$transaction(async (tx) => {
      const created = await tx.tripLike.create({
        data: { tripId: trip.id, userId: input.userId },
      });
      await tx.trip.update({
        where: { id: trip.id },
        data: { likeCount: { increment: 1 } },
      });
      return created;
    });

    await awardTravelerScore({
      userId: trip.ownerId,
      action: "TRIP_LIKE_RECEIVED",
      tripId: trip.id,
      referenceKey: like.id,
      correlationId: input.correlationId,
    });

    const updated = await prisma.trip.findUniqueOrThrow({
      where: { id: trip.id },
      select: { likeCount: true },
    });
    return { liked: true as const, likeCount: updated.likeCount };
  } catch {
    throw new AppError({
      code: "CONFLICT",
      message: "Bu gezeyi zaten beğendin.",
      status: 409,
    });
  }
}

export async function unlikePublicTrip(input: { userId: string; tripId: string }) {
  const existing = await prisma.tripLike.findUnique({
    where: {
      tripId_userId: { tripId: input.tripId, userId: input.userId },
    },
  });
  if (!existing) {
    const trip = await prisma.trip.findFirst({
      where: { id: input.tripId, deletedAt: null },
      select: { likeCount: true },
    });
    return { liked: false as const, likeCount: trip?.likeCount ?? 0 };
  }

  const trip = await prisma.$transaction(async (tx) => {
    await tx.tripLike.delete({ where: { id: existing.id } });
    return tx.trip.update({
      where: { id: input.tripId },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    });
  });

  // Note: score from received likes is not revoked in v1 (keeps economy simple).
  const likeCount = Math.max(0, trip.likeCount);
  if (trip.likeCount < 0) {
    await prisma.trip.update({
      where: { id: input.tripId },
      data: { likeCount: 0 },
    });
  }
  return {
    liked: false as const,
    likeCount,
  };
}

export async function setTripVisibility(input: {
  ownerId: string;
  tripId: string;
  visibility: "PRIVATE" | "PUBLIC";
}) {
  const trip = await prisma.trip.findFirst({
    where: { id: input.tripId, ownerId: input.ownerId, deletedAt: null },
  });
  if (!trip) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Gezi bulunamadı.",
      status: 404,
    });
  }
  if (trip.status === "ARCHIVED") {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Arşivlenmiş gezi paylaşılamaz.",
      status: 400,
    });
  }

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: { visibility: input.visibility },
    select: {
      id: true,
      visibility: true,
      likeCount: true,
      title: true,
    },
  });
  return updated;
}

export async function listExploreTrips(input: {
  viewerId?: string | null;
  feed?: "public" | "following";
  limit?: number;
  cursor?: string;
}) {
  const limit = Math.min(input.limit ?? 20, 50);
  const feed = input.feed ?? "public";

  if (feed === "following") {
    if (!input.viewerId) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Following feed için giriş gerekli.",
        status: 401,
      });
    }
  }

  const followingOwnerIds =
    feed === "following" && input.viewerId
      ? (
          await prisma.userFollow.findMany({
            where: { followerId: input.viewerId, status: "ACTIVE" },
            select: { followingId: true },
          })
        ).map((row) => row.followingId)
      : [];

  if (feed === "following" && followingOwnerIds.length === 0) {
    return { trips: [], nextCursor: null };
  }

  const trips = await prisma.trip.findMany({
    where: {
      deletedAt: null,
      status: "DRAFT",
      visibility: "PUBLIC",
      ...(feed === "following"
        ? { ownerId: { in: followingOwnerIds } }
        : {
            ...(input.viewerId ? { ownerId: { not: input.viewerId } } : {}),
            owner: {
              accountVisibility: "PUBLIC",
              status: "ACTIVE",
              deletedAt: null,
            },
          }),
    },
    include: {
      owner: {
        select: {
          id: true,
          travelerScoreMinor: true,
          accountVisibility: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: { select: { days: true } },
      likes: input.viewerId
        ? {
            where: { userId: input.viewerId },
            select: { id: true },
            take: 1,
          }
        : false,
      comments: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ likeCount: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });

  const ranked = trips
    .map((trip) => {
      const scoreMinor = trip.owner.travelerScoreMinor;
      const rank = exploreRankScore({
        travelerScoreMinor: scoreMinor,
        likeCount: trip.likeCount,
      });
      return { trip, rank };
    })
    .sort(
      (a, b) =>
        b.rank - a.rank || b.trip.updatedAt.getTime() - a.trip.updatedAt.getTime(),
    );

  let start = 0;
  if (input.cursor) {
    const idx = ranked.findIndex((row) => row.trip.id === input.cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const page = ranked.slice(start, start + limit);
  const nextCursor =
    start + limit < ranked.length ? page[page.length - 1]?.trip.id : null;

  return {
    trips: page.map(({ trip }) => {
      const scorePoints = pointsFromMinor(trip.owner.travelerScoreMinor);
      const likedByViewer = Boolean(
        input.viewerId && Array.isArray(trip.likes) && trip.likes.length > 0,
      );
      return {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        destinationName: trip.destinationName,
        destinationRegion: trip.destinationRegionNameSnapshot,
        startDate: formatDateOnly(trip.startDate),
        endDate: formatDateOnly(trip.endDate),
        dayCount: trip._count.days,
        likeCount: trip.likeCount,
        commentCount: trip.commentCount,
        likedByViewer,
        recentComments: trip.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.user.id,
            username: comment.user.profile?.username ?? "gezgin",
            displayName: comment.user.profile?.displayName ?? "Gezgin",
          },
        })),
        owner: {
          id: trip.owner.id,
          username: trip.owner.profile?.username ?? "gezgin",
          displayName: trip.owner.profile?.displayName ?? "Gezgin",
          avatarUrl: trip.owner.profile?.avatarUrl ?? null,
          travelerScore: scorePoints,
          badge: primaryBadgeForScore(scorePoints),
          accountVisibility: trip.owner.accountVisibility,
        },
        updatedAt: trip.updatedAt.toISOString(),
      };
    }),
    nextCursor,
  };
}

export async function getPublicTripDetail(input: {
  tripId: string;
  viewerId?: string | null;
}) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: input.tripId,
      deletedAt: null,
      status: "DRAFT",
      visibility: "PUBLIC",
    },
    include: {
      owner: {
        select: {
          id: true,
          travelerScoreMinor: true,
          accountVisibility: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      },
      days: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: {
          items: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
      },
      likes: input.viewerId
        ? {
            where: { userId: input.viewerId },
            select: { id: true },
            take: 1,
          }
        : false,
    },
  });

  if (!trip) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Public gezi bulunamadı.",
      status: 404,
    });
  }

  const access = await resolveAccountAccess({
    viewerId: input.viewerId,
    ownerId: trip.owner.id,
    accountVisibility: trip.owner.accountVisibility,
  });
  if (!access.canViewContent) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Public gezi bulunamadı.",
      status: 404,
    });
  }

  const scorePoints = pointsFromMinor(trip.owner.travelerScoreMinor);
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    destinationName: trip.destinationName,
    startDate: formatDateOnly(trip.startDate),
    endDate: formatDateOnly(trip.endDate),
    likeCount: trip.likeCount,
    likedByViewer: Boolean(
      input.viewerId && Array.isArray(trip.likes) && trip.likes.length > 0,
    ),
    commentCount: trip.commentCount,
    owner: {
      id: trip.owner.id,
      username: trip.owner.profile?.username ?? "gezgin",
      displayName: trip.owner.profile?.displayName ?? "Gezgin",
      avatarUrl: trip.owner.profile?.avatarUrl ?? null,
      bio: trip.owner.profile?.bio ?? null,
      travelerScore: scorePoints,
      badge: primaryBadgeForScore(scorePoints),
    },
    days: trip.days.map((day, index) => ({
      id: day.id,
      dayNumber: index + 1,
      date: formatDateOnly(day.date),
      title: day.title,
      notes: day.notes,
      items: day.items
        .filter((item) => item.type === "NOTE" || item.description)
        .map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          locationName: item.locationName,
        })),
    })),
  };
}

export async function getTravelerProfileSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      travelerScoreMinor: true,
      accountVisibility: true,
      profile: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
      _count: {
        select: {
          trips: { where: { deletedAt: null, visibility: "PUBLIC" } },
          followers: { where: { status: "ACTIVE" } },
          following: { where: { status: "ACTIVE" } },
        },
      },
    },
  });
  if (!user) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Kullanıcı bulunamadı.",
      status: 404,
    });
  }
  const score = pointsFromMinor(user.travelerScoreMinor);
  const pendingFollowRequestCount = await prisma.userFollow.count({
    where: { followingId: userId, status: "PENDING" },
  });
  return {
    username: user.profile?.username ?? "gezgin",
    displayName: user.profile?.displayName ?? "Gezgin",
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? null,
    accountVisibility: user.accountVisibility,
    travelerScore: score,
    travelerScoreMinor: user.travelerScoreMinor,
    badge: primaryBadgeForScore(score),
    publicTripCount: user._count.trips,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    pendingFollowRequestCount,
  };
}
