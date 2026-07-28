import "server-only";

import type { AccountVisibility, FollowStatus } from "@prisma/client";

import { prisma } from "@/server/infrastructure/database";

export type AccountAccess = {
  canViewContent: boolean;
  followStatus: FollowStatus | null;
  isSelf: boolean;
};

/** Whether viewer may see the owner's public trips / rich profile content. */
export async function resolveAccountAccess(input: {
  viewerId?: string | null;
  ownerId: string;
  accountVisibility: AccountVisibility;
}): Promise<AccountAccess> {
  const isSelf = Boolean(input.viewerId && input.viewerId === input.ownerId);
  if (isSelf) {
    return { canViewContent: true, followStatus: null, isSelf: true };
  }

  if (input.accountVisibility === "PUBLIC") {
    let followStatus: FollowStatus | null = null;
    if (input.viewerId) {
      const row = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: input.viewerId,
            followingId: input.ownerId,
          },
        },
        select: { status: true },
      });
      followStatus = row?.status ?? null;
    }
    return { canViewContent: true, followStatus, isSelf: false };
  }

  // Private account: only approved followers see content.
  if (!input.viewerId) {
    return { canViewContent: false, followStatus: null, isSelf: false };
  }

  const row = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: input.viewerId,
        followingId: input.ownerId,
      },
    },
    select: { status: true },
  });
  const followStatus = row?.status ?? null;
  return {
    canViewContent: followStatus === "ACTIVE",
    followStatus,
    isSelf: false,
  };
}
