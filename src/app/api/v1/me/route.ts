import { deleteAccountSchema } from "@/features/auth/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { signOut } from "@/lib/auth/auth";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { deleteAccountService } from "@/server/application/delete-account";
import { getCurrentUser } from "@/server/application/get-current-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const user = await getCurrentUser(userId);
    return jsonOk({ user }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const body = await parseJsonBody(request, deleteAccountSchema);

    await deleteAccountService({
      userId,
      password: body.password,
      correlationId,
    });

    await signOut({ redirect: false });

    return jsonOk({ success: true }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
