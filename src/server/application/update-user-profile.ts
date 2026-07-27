import "server-only";

import { AppError } from "@/lib/errors";
import { recordAuthAuditEvent } from "@/lib/auth/audit";
import { normalizeUsername, validateUsername } from "@/lib/auth/username";
import type { UpdateProfileInput } from "@/features/auth/schemas";
import { toAuthenticatedUser, type AuthenticatedUser } from "@/features/auth/types";
import { assertActiveUser } from "@/server/domain/authorization";
import {
  findProfileByNormalizedUsername,
  findUserById,
  isUniqueConstraintError,
  updateUserProfile,
} from "@/server/repositories/user-repository";

export async function updateUserProfileService(input: {
  userId: string;
  data: UpdateProfileInput;
  correlationId?: string;
}): Promise<AuthenticatedUser> {
  const user = await findUserById(input.userId);
  if (!user || !user.profile) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      message: "Your profile could not be found.",
      status: 404,
    });
  }

  assertActiveUser(user.status);

  const data = input.data;
  let usernameNormalized: string | undefined;

  if (data.username !== undefined) {
    const result = validateUsername(data.username);
    if (!result.ok) {
      throw new AppError({
        code: "USER_PROFILE_INVALID",
        message: result.message,
        status: 400,
      });
    }
    usernameNormalized = result.normalized;

    const existing = await findProfileByNormalizedUsername(usernameNormalized);
    if (existing && existing.userId !== input.userId) {
      throw new AppError({
        code: "USER_PROFILE_CONFLICT",
        message: "This username is not available.",
        status: 409,
      });
    }
  }

  try {
    await updateUserProfile(input.userId, {
      ...(data.username !== undefined
        ? {
            username: usernameNormalized ?? normalizeUsername(data.username),
            usernameNormalized: usernameNormalized ?? normalizeUsername(data.username),
          }
        : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.avatarUrl !== undefined
        ? { avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl }
        : {}),
      ...(data.homeCountryCode !== undefined
        ? {
            homeCountryCode: data.homeCountryCode
              ? data.homeCountryCode.toUpperCase()
              : null,
          }
        : {}),
      ...(data.homeCity !== undefined ? { homeCity: data.homeCity } : {}),
      ...(data.preferredCurrency !== undefined
        ? { preferredCurrency: data.preferredCurrency.toUpperCase() }
        : {}),
      ...(data.preferredLanguage !== undefined
        ? { preferredLanguage: data.preferredLanguage }
        : {}),
      ...(data.travelPreferences !== undefined
        ? { travelPreferences: data.travelPreferences }
        : {}),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError({
        code: "USER_PROFILE_CONFLICT",
        message: "This username is not available.",
        status: 409,
      });
    }
    throw error;
  }

  const refreshed = await findUserById(input.userId);
  if (!refreshed?.profile) {
    throw new AppError({
      code: "USER_NOT_FOUND",
      message: "Your profile could not be found.",
      status: 404,
    });
  }

  recordAuthAuditEvent({
    event: "profile_updated",
    correlationId: input.correlationId,
    userId: input.userId,
    outcome: "success",
  });

  return toAuthenticatedUser(refreshed, refreshed.profile);
}
