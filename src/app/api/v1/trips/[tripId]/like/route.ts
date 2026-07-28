import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { likePublicTrip, unlikePublicTrip } from "@/server/application/traveler/explore";

export const runtime = "nodejs";

type Params = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const { tripId } = await params;
    const result = await likePublicTrip({
      userId,
      tripId,
      correlationId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const { tripId } = await params;
    const result = await unlikePublicTrip({ userId, tripId });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
