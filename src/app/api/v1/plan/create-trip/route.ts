import { createPlanTripSchema } from "@/features/plan/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import { createPlanTripService } from "@/server/application/plan/create-plan-trip";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const ownerId = await requireSessionUserId();
    const data = await parseJsonBody(request, createPlanTripSchema);
    const result = await createPlanTripService({ ownerId, data, correlationId });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
