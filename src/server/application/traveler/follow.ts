import "server-only";

import { AppError } from "@/lib/errors";
import { normalizeUsername } from "@/lib/auth/username";
import { prisma } from "@/server/infrastructure/database";
import { pointsFromMinor, primaryBadgeForScore } from "@/server/domain/traveler/score";
import { formatDateOnly } from "@/server/domain/trips/date-only";
import { resolveAccountAccess } from "@/server/domain/traveler/visibility";

function mapTravelerCard(user: {
  id: string;
  travelerScoreMinor: number;
  accountVisibility: "PRIVATE" | "PUBLIC";
  profile: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
}) {
  const score = pointsFromMinor(user.travelerScoreMinor);
  return {
    id: user.id,
    username: user.profile?.username ?? "gezgin",
    displayName: user.profile?.displayName ?? "Gezgin",
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? null,
    accountVisibility: user.accountVisibility,
    travelerScore: score,
    badge: primaryBadgeForScore(score),
  };
}

export async function followTraveler(input: { followerId: string; username: string }) {
  const usernameNormalized = normalizeUsername(input.username);
  const target = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      profile: { usernameNormalized },
    },
    select: {
      id: true,
      accountVisibility: true,
      profile: { select: { username: true } },
    },
  });
  if (!target) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Gezgin bulunamadı.",
      status: 404,
    });
  }
  if (target.id === input.followerId) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Kendini takip edemezsin.",
      status: 400,
    });
  }

  const desiredStatus = target.accountVisibility === "PUBLIC" ? "ACTIVE" : "PENDING";

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: input.followerId,
        followingId: target.id,
      },
    },
  });

  if (existing?.status === "ACTIVE") {
    return { status: "ACTIVE" as const, username: target.profile?.username };
  }
  if (existing?.status === "PENDING" && desiredStatus === "PENDING") {
    return { status: "PENDING" as const, username: target.profile?.username };
  }

  const row = await prisma.userFollow.upsert({
    where: {
      followerId_followingId: {
        followerId: input.followerId,
        followingId: target.id,
      },
    },
    create: {
      followerId: input.followerId,
      followingId: target.id,
      status: desiredStatus,
    },
    update: { status: desiredStatus },
    select: { status: true },
  });

  return {
    status: row.status,
    username: target.profile?.username,
  };
}

export async function unfollowTraveler(input: { followerId: string; username: string }) {
  const usernameNormalized = normalizeUsername(input.username);
  const target = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      profile: { usernameNormalized },
    },
    select: { id: true, profile: { select: { username: true } } },
  });
  if (!target) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Gezgin bulunamadı.",
      status: 404,
    });
  }

  await prisma.userFollow.deleteMany({
    where: { followerId: input.followerId, followingId: target.id },
  });

  return { status: null, username: target.profile?.username };
}

export async function listPendingFollowRequests(input: {
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const limit = Math.min(input.limit ?? 30, 50);
  const rows = await prisma.userFollow.findMany({
    where: {
      followingId: input.userId,
      status: "PENDING",
      ...(input.cursor ? { id: { lt: input.cursor } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      follower: {
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
    },
  });

  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1]?.id : null;

  return {
    requests: page.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      follower: mapTravelerCard(row.follower),
    })),
    nextCursor,
  };
}

export async function countPendingFollowRequests(userId: string) {
  return prisma.userFollow.count({
    where: { followingId: userId, status: "PENDING" },
  });
}

export async function acceptFollowRequest(input: { userId: string; requestId: string }) {
  const row = await prisma.userFollow.findFirst({
    where: {
      id: input.requestId,
      followingId: input.userId,
      status: "PENDING",
    },
  });
  if (!row) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Takip isteği bulunamadı.",
      status: 404,
    });
  }
  await prisma.userFollow.update({
    where: { id: row.id },
    data: { status: "ACTIVE" },
  });
  return { status: "ACTIVE" as const };
}

export async function rejectFollowRequest(input: { userId: string; requestId: string }) {
  const deleted = await prisma.userFollow.deleteMany({
    where: {
      id: input.requestId,
      followingId: input.userId,
      status: "PENDING",
    },
  });
  if (deleted.count === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Takip isteği bulunamadı.",
      status: 404,
    });
  }
  return { status: null };
}

export async function setAccountVisibility(input: {
  userId: string;
  visibility: "PRIVATE" | "PUBLIC";
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: input.userId },
      data: { accountVisibility: input.visibility },
      select: { id: true, accountVisibility: true },
    });

    // Going public: auto-accept all pending follow requests.
    if (input.visibility === "PUBLIC") {
      await tx.userFollow.updateMany({
        where: { followingId: input.userId, status: "PENDING" },
        data: { status: "ACTIVE" },
      });
    }

    return user;
  });

  return { accountVisibility: updated.accountVisibility };
}

export async function getTravelerPublicProfile(input: {
  username: string;
  viewerId?: string | null;
}) {
  const usernameNormalized = normalizeUsername(input.username);
  const user = await prisma.user.findFirst({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      profile: { usernameNormalized },
    },
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
      _count: {
        select: {
          followers: { where: { status: "ACTIVE" } },
          following: { where: { status: "ACTIVE" } },
          trips: { where: { deletedAt: null, visibility: "PUBLIC" } },
        },
      },
    },
  });

  if (!user) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Gezgin bulunamadı.",
      status: 404,
    });
  }

  const access = await resolveAccountAccess({
    viewerId: input.viewerId,
    ownerId: user.id,
    accountVisibility: user.accountVisibility,
  });

  const card = mapTravelerCard(user);
  return {
    ...card,
    bio: access.canViewContent ? card.bio : null,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    publicTripCount: access.canViewContent ? user._count.trips : null,
    canViewContent: access.canViewContent,
    isSelf: access.isSelf,
    followStatus: access.followStatus,
  };
}

export async function listTravelerPublicTrips(input: {
  username: string;
  viewerId?: string | null;
  cursor?: string;
  limit?: number;
}) {
  const profile = await getTravelerPublicProfile({
    username: input.username,
    viewerId: input.viewerId,
  });

  if (!profile.canViewContent) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Bu gezginin gezileri görünür değil.",
      status: 403,
    });
  }

  const limit = Math.min(input.limit ?? 20, 50);
  const rows = await prisma.trip.findMany({
    where: {
      ownerId: profile.id,
      deletedAt: null,
      status: "DRAFT",
      visibility: "PUBLIC",
      ...(input.cursor ? { id: { lt: input.cursor } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      title: true,
      description: true,
      destinationName: true,
      destinationRegionNameSnapshot: true,
      startDate: true,
      endDate: true,
      likeCount: true,
      commentCount: true,
      updatedAt: true,
      _count: { select: { days: true } },
    },
  });

  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1]?.id : null;

  return {
    trips: page.map((trip) => ({
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
      updatedAt: trip.updatedAt.toISOString(),
    })),
    nextCursor,
  };
}

export async function listFollowers(input: {
  username: string;
  viewerId?: string | null;
  cursor?: string;
  limit?: number;
}) {
  return listFollowGraph({ ...input, direction: "followers" });
}

export async function listFollowing(input: {
  username: string;
  viewerId?: string | null;
  cursor?: string;
  limit?: number;
}) {
  return listFollowGraph({ ...input, direction: "following" });
}

async function listFollowGraph(input: {
  username: string;
  viewerId?: string | null;
  cursor?: string;
  limit?: number;
  direction: "followers" | "following";
}) {
  const profile = await getTravelerPublicProfile({
    username: input.username,
    viewerId: input.viewerId,
  });
  if (!profile.canViewContent && !profile.isSelf) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Bu listenin görünürlüğü kısıtlı.",
      status: 403,
    });
  }

  const limit = Math.min(input.limit ?? 30, 50);
  const whereBase =
    input.direction === "followers"
      ? { followingId: profile.id, status: "ACTIVE" as const }
      : { followerId: profile.id, status: "ACTIVE" as const };

  const rows = await prisma.userFollow.findMany({
    where: {
      ...whereBase,
      ...(input.cursor ? { id: { lt: input.cursor } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      follower: {
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
      following: {
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
    },
  });

  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1]?.id : null;
  const travelers = page.map((row) =>
    mapTravelerCard(input.direction === "followers" ? row.follower : row.following),
  );

  return { travelers, nextCursor };
}

export async function searchTravelers(input: {
  query: string;
  viewerId?: string | null;
  limit?: number;
}) {
  const q = input.query.trim();
  if (q.length < 2) {
    return { travelers: [] as ReturnType<typeof mapTravelerCard>[] };
  }

  const limit = Math.min(input.limit ?? 20, 30);
  const normalized = normalizeUsername(q);

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      profile: {
        OR: [
          { usernameNormalized: { contains: normalized } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      ...(input.viewerId ? { id: { not: input.viewerId } } : {}),
    },
    take: limit,
    orderBy: [{ travelerScoreMinor: "desc" }, { createdAt: "desc" }],
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
  });

  return { travelers: users.map(mapTravelerCard) };
}
