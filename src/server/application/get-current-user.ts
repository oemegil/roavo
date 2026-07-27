import "server-only";

import { UnauthorizedError, AppError } from "@/lib/errors";
import { assertActiveUser } from "@/server/domain/authorization";
import { toAuthenticatedUser, type AuthenticatedUser } from "@/features/auth/types";
import { findUserById } from "@/server/repositories/user-repository";

export async function getCurrentUser(userId: string | null | undefined): Promise<AuthenticatedUser> {
  if (!userId) {
    throw new UnauthorizedError();
  }

  const user = await findUserById(userId);
  if (!user || !user.profile) {
    throw new UnauthorizedError();
  }

  assertActiveUser(user.status);
  return toAuthenticatedUser(user, user.profile);
}

export async function getCurrentUserOrNull(
  userId: string | null | undefined,
): Promise<AuthenticatedUser | null> {
  try {
    return await getCurrentUser(userId);
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof AppError) {
      return null;
    }
    throw error;
  }
}
