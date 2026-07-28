import { setTripVisibilitySchema } from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { setTripVisibility } from "@/server/application/traveler/explore";

export const runtime = "nodejs";

type Params = { params: Promise<{ tripId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = await params;
    const body = await parseJsonBody(request, setTripVisibilitySchema);
    const result = await setTripVisibility({
      ownerId,
      tripId,
      visibility: body.visibility,
    });
    return jsonOk({ trip: result }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
