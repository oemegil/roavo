import { setAccountVisibilitySchema } from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { setAccountVisibility } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const body = await parseJsonBody(request, setAccountVisibilitySchema);
    const result = await setAccountVisibility({
      userId,
      visibility: body.visibility,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
