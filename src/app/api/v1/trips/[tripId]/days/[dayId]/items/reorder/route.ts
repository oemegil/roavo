import { z } from "zod";

import { reorderItemsSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { reorderItineraryItemsService } from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ tripId: string; dayId: string }> },
) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(
      await context.params,
      z.object({ tripId: z.string().min(1), dayId: z.string().min(1) }),
    );
    const body = await parseJsonBody(request, reorderItemsSchema);
    const trip = await reorderItineraryItemsService({
      ownerId,
      tripId: params.tripId,
      dayId: params.dayId,
      orderedItemIds: body.orderedItemIds,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
