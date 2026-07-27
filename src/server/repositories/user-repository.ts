import "server-only";

import type { Prisma, User, UserProfile, UserStatus } from "@prisma/client";

import { prisma } from "@/server/infrastructure/database";

export type UserWithProfile = User & { profile: UserProfile | null };

export async function findUserByNormalizedEmail(
  emailNormalized: string,
): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { emailNormalized },
    include: { profile: true },
  });
}

export async function findUserById(id: string): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
}

export async function findProfileByNormalizedUsername(usernameNormalized: string) {
  return prisma.userProfile.findUnique({
    where: { usernameNormalized },
  });
}

export async function findUserByNormalizedUsername(
  usernameNormalized: string,
): Promise<UserWithProfile | null> {
  return prisma.user.findFirst({
    where: { profile: { usernameNormalized } },
    include: { profile: true },
  });
}

export async function createUserWithProfile(input: {
  email: string;
  emailNormalized: string;
  passwordHash: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
}): Promise<UserWithProfile> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        emailNormalized: input.emailNormalized,
        passwordHash: input.passwordHash,
        status: "ACTIVE",
        role: "USER",
        profile: {
          create: {
            username: input.username,
            usernameNormalized: input.usernameNormalized,
            displayName: input.displayName,
            travelPreferences: {},
          },
        },
      },
      include: { profile: true },
    });

    return user;
  });
}

export async function updateUserProfile(
  userId: string,
  data: Prisma.UserProfileUpdateInput,
): Promise<UserProfile> {
  return prisma.userProfile.update({
    where: { userId },
    data,
  });
}

export async function softDeleteUser(input: {
  userId: string;
  anonymizedEmail: string;
  anonymizedEmailNormalized: string;
  anonymizedUsername: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: {
        status: "DELETED" satisfies UserStatus,
        deletedAt: new Date(),
        email: input.anonymizedEmail,
        emailNormalized: input.anonymizedEmailNormalized,
        passwordHash: null,
        tokenVersion: { increment: 1 },
      },
    });

    await tx.userProfile.update({
      where: { userId: input.userId },
      data: {
        displayName: "Deleted user",
        username: input.anonymizedUsername,
        usernameNormalized: input.anonymizedUsername,
        bio: null,
        avatarUrl: null,
        homeCity: null,
        homeCountryCode: null,
        travelPreferences: {},
      },
    });

    await tx.session.deleteMany({ where: { userId: input.userId } });
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export function uniqueConstraintTargets(error: unknown): string[] {
  if (
    typeof error === "object" &&
    error !== null &&
    "meta" in error &&
    typeof (error as { meta?: { target?: unknown } }).meta?.target !== "undefined"
  ) {
    const target = (error as { meta: { target: string[] | string } }).meta.target;
    return Array.isArray(target) ? target : [String(target)];
  }
  return [];
}
