import { z } from "zod";

import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseRouteParams } from "@/lib/validation/http";
import { restoreTripService } from "@/server/application/trips/lifecycle";

export const runtime = "nodejs";

const paramsSchema = z.object({ tripId: z.string().min(1) });

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    const trip = await restoreTripService({ ownerId, tripId, correlationId });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
