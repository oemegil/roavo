import "server-only";

import { AppError } from "@/lib/errors";
import { recordAuthAuditEvent } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { toAuthenticatedUser, type AuthenticatedUser } from "@/features/auth/types";
import type { RegisterInput } from "@/features/auth/schemas";
import {
  createUserWithProfile,
  findProfileByNormalizedUsername,
  findUserByNormalizedEmail,
  isUniqueConstraintError,
  uniqueConstraintTargets,
} from "@/server/repositories/user-repository";

export async function registerUser(
  input: RegisterInput,
  correlationId?: string,
): Promise<AuthenticatedUser> {
  const passwordPolicy = validatePasswordPolicy(input.password);
  if (!passwordPolicy.ok) {
    recordAuthAuditEvent({
      event: "registration_failed",
      correlationId,
      outcome: "failure",
      metadata: { reason: "password_policy" },
    });
    throw new AppError({
      code: "AUTH_PASSWORD_POLICY_FAILED",
      message: passwordPolicy.message,
      status: 400,
    });
  }

  const existingEmail = await findUserByNormalizedEmail(input.emailNormalized);
  if (existingEmail && existingEmail.status !== "DELETED") {
    recordAuthAuditEvent({
      event: "registration_failed",
      correlationId,
      outcome: "failure",
      metadata: { reason: "email_unavailable" },
    });
    throw new AppError({
      code: "AUTH_EMAIL_UNAVAILABLE",
      message: "An account with this email already exists.",
      status: 409,
    });
  }

  const existingUsername = await findProfileByNormalizedUsername(input.usernameNormalized);
  if (existingUsername) {
    recordAuthAuditEvent({
      event: "registration_failed",
      correlationId,
      outcome: "failure",
      metadata: { reason: "username_unavailable" },
    });
    throw new AppError({
      code: "AUTH_USERNAME_UNAVAILABLE",
      message: "This username is not available.",
      status: 409,
    });
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await createUserWithProfile({
      email: input.email,
      emailNormalized: input.emailNormalized,
      passwordHash,
      username: input.username,
      usernameNormalized: input.usernameNormalized,
      displayName: input.displayName,
    });

    if (!user.profile) {
      throw new AppError({
        code: "INTERNAL_ERROR",
        message: "We couldn't complete registration. Please try again.",
        status: 500,
      });
    }

    recordAuthAuditEvent({
      event: "registration_succeeded",
      correlationId,
      userId: user.id,
      outcome: "success",
    });

    return toAuthenticatedUser(user, user.profile);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const targets = uniqueConstraintTargets(error);
      if (targets.some((t) => t.includes("email"))) {
        throw new AppError({
          code: "AUTH_EMAIL_UNAVAILABLE",
          message: "An account with this email already exists.",
          status: 409,
        });
      }
      throw new AppError({
        code: "AUTH_USERNAME_UNAVAILABLE",
        message: "This username is not available.",
        status: 409,
      });
    }

    recordAuthAuditEvent({
      event: "registration_failed",
      correlationId,
      outcome: "failure",
      metadata: { reason: "unexpected" },
    });
    throw error;
  }
}
