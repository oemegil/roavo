import "server-only";

import { createRequestLogger } from "@/lib/logging/logger";

export type AuthAuditEvent =
  | "registration_succeeded"
  | "registration_failed"
  | "login_succeeded"
  | "login_failed"
  | "logout"
  | "profile_updated"
  | "account_deleted"
  | "suspended_user_rejected";

export function recordAuthAuditEvent(input: {
  event: AuthAuditEvent;
  correlationId?: string;
  userId?: string;
  outcome: "success" | "failure";
  metadata?: Record<string, unknown>;
}) {
  const log = createRequestLogger(input.correlationId ?? "audit");
  log.info("Auth audit event", {
    auditEvent: input.event,
    userId: input.userId,
    outcome: input.outcome,
    ...input.metadata,
  });
}
