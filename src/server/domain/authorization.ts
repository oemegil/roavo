import "server-only";

import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";

export function requireAuthenticatedUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export function assertResourceOwner(currentUserId: string, ownerUserId: string): void {
  if (currentUserId !== ownerUserId) {
    throw new ForbiddenError("You do not have access to this resource.");
  }
}

export function assertActiveUser(status: string): void {
  if (status !== "ACTIVE") {
    throw new AppError({
      code: "AUTH_ACCOUNT_DISABLED",
      message: "This account is not available.",
      status: 403,
    });
  }
}
