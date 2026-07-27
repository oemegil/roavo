import "server-only";

import { AppError, AuthInvalidCredentialsError } from "@/lib/errors";
import { recordAuthAuditEvent } from "@/lib/auth/audit";
import { verifyPassword } from "@/lib/auth/password";
import { assertActiveUser } from "@/server/domain/authorization";
import {
  findUserById,
  softDeleteUser,
} from "@/server/repositories/user-repository";

export async function deleteAccountService(input: {
  userId: string;
  password: string;
  correlationId?: string;
}): Promise<void> {
  const user = await findUserById(input.userId);
  if (!user || !user.passwordHash) {
    throw new AppError({
      code: "USER_ACCOUNT_DELETION_FAILED",
      message: "We couldn't delete your account. Please try again.",
      status: 400,
    });
  }

  assertActiveUser(user.status);

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw new AuthInvalidCredentialsError();
  }

  const suffix = user.id.slice(-8);
  const anonymizedUsername = `deleted_${suffix}`;
  const anonymizedEmail = `deleted+${suffix}@deleted.roavo.local`;

  try {
    await softDeleteUser({
      userId: user.id,
      anonymizedEmail,
      anonymizedEmailNormalized: anonymizedEmail,
      anonymizedUsername,
    });
  } catch (error) {
    recordAuthAuditEvent({
      event: "account_deleted",
      correlationId: input.correlationId,
      userId: user.id,
      outcome: "failure",
    });
    throw new AppError({
      code: "USER_ACCOUNT_DELETION_FAILED",
      message: "We couldn't delete your account. Please try again.",
      status: 500,
      cause: error,
    });
  }

  recordAuthAuditEvent({
    event: "account_deleted",
    correlationId: input.correlationId,
    userId: user.id,
    outcome: "success",
  });
}
