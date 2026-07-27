import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { recordAuthAuditEvent } from "@/lib/auth/audit";
import { signOut } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await getSessionUserId();
    await signOut({ redirect: false });

    recordAuthAuditEvent({
      event: "logout",
      correlationId,
      userId: userId ?? undefined,
      outcome: "success",
    });

    return jsonOk({ success: true }, { status: 200, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
