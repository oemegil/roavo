import { previewPlanItinerarySchema } from "@/features/plan/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { previewPlanItineraryService } from "@/server/application/plan/preview-plan-itinerary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const data = await parseJsonBody(request, previewPlanItinerarySchema);
    const result = await previewPlanItineraryService({
      userId,
      data,
      correlationId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
