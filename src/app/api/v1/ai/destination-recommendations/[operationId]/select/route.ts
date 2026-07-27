import { selectDestinationRecommendationSchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { selectDestinationRecommendationService } from "@/server/application/ai/destination-recommendations";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ operationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { operationId } = await context.params;
    const body = await parseJsonBody(request, selectDestinationRecommendationSchema);
    const result = await selectDestinationRecommendationService({
      userId,
      operationId,
      recommendationRank: body.recommendationRank,
      tripId: body.tripId,
      correlationId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
