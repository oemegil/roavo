import "server-only";

import {
  AuthAccountDisabledError,
  AuthInvalidCredentialsError,
} from "@/lib/errors";
import { recordAuthAuditEvent } from "@/lib/auth/audit";
import {
  DEV_LOGIN_BYPASS_USERNAME,
  isDevLoginBypass,
} from "@/lib/auth/dev-login-bypass";
import { normalizeEmail } from "@/lib/auth/normalize-email";
import { verifyPassword } from "@/lib/auth/password";
import { toAuthenticatedUser, type AuthenticatedUser } from "@/features/auth/types";
import {
  findUserByNormalizedEmail,
  findUserByNormalizedUsername,
} from "@/server/repositories/user-repository";

export async function authenticateUser(input: {
  email: string;
  password: string;
  correlationId?: string;
}): Promise<AuthenticatedUser & { tokenVersion: number }> {
  if (isDevLoginBypass(input.email, input.password)) {
    const user = await findUserByNormalizedUsername(DEV_LOGIN_BYPASS_USERNAME);
    if (!user || !user.profile || user.status !== "ACTIVE") {
      recordAuthAuditEvent({
        event: "login_failed",
        correlationId: input.correlationId,
        outcome: "failure",
        metadata: { reason: "dev_bypass_user_missing" },
      });
      throw new AuthInvalidCredentialsError();
    }

    recordAuthAuditEvent({
      event: "login_succeeded",
      correlationId: input.correlationId,
      userId: user.id,
      outcome: "success",
      metadata: { reason: "dev_bypass" },
    });

    return {
      ...toAuthenticatedUser(user, user.profile),
      tokenVersion: user.tokenVersion,
    };
  }

  const emailNormalized = normalizeEmail(input.email);

  // Constant-ish path: always attempt a verify when possible to reduce timing hints.
  const user = await findUserByNormalizedEmail(emailNormalized);

  if (!user || !user.passwordHash || !user.profile) {
    recordAuthAuditEvent({
      event: "login_failed",
      correlationId: input.correlationId,
      outcome: "failure",
      metadata: { reason: "invalid_credentials" },
    });
    throw new AuthInvalidCredentialsError();
  }

  if (user.status === "SUSPENDED" || user.status === "DELETED") {
    recordAuthAuditEvent({
      event: "suspended_user_rejected",
      correlationId: input.correlationId,
      userId: user.id,
      outcome: "failure",
      metadata: { status: user.status },
    });
    throw new AuthAccountDisabledError();
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    recordAuthAuditEvent({
      event: "login_failed",
      correlationId: input.correlationId,
      userId: user.id,
      outcome: "failure",
      metadata: { reason: "invalid_credentials" },
    });
    throw new AuthInvalidCredentialsError();
  }

  recordAuthAuditEvent({
    event: "login_succeeded",
    correlationId: input.correlationId,
    userId: user.id,
    outcome: "success",
  });

  return {
    ...toAuthenticatedUser(user, user.profile),
    tokenVersion: user.tokenVersion,
  };
}
