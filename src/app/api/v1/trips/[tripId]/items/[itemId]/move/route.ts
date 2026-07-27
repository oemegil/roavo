import { z } from "zod";

import { moveItemSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { moveItineraryItemService } from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string; itemId: string }> },
) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(
      await context.params,
      z.object({ tripId: z.string().min(1), itemId: z.string().min(1) }),
    );
    const body = await parseJsonBody(request, moveItemSchema);
    const trip = await moveItineraryItemService({
      ownerId,
      tripId: params.tripId,
      itemId: params.itemId,
      targetTripDayId: body.targetTripDayId,
      targetIndex: body.targetIndex,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
