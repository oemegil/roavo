import { updateProfileSchema } from "@/features/auth/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { updateUserProfileService } from "@/server/application/update-user-profile";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const data = await parseJsonBody(request, updateProfileSchema);
    const user = await updateUserProfileService({
      userId,
      data,
      correlationId,
    });

    return jsonOk({ user }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
