import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/auth/session";
import { getPublicTripDetail } from "@/server/application/traveler/explore";

export const runtime = "nodejs";

type Params = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const { tripId } = await params;
    const viewerId = await getSessionUserId();
    const trip = await getPublicTripDetail({ tripId, viewerId });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
