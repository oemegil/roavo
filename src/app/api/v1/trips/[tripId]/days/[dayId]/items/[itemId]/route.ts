import { z } from "zod";

import { updateItineraryItemSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import {
  deleteItineraryItemService,
  updateItineraryItemService,
} from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

type ItemCtx = {
  params: Promise<{ tripId: string; dayId: string; itemId: string }>;
};

const paramsSchema = z.object({
  tripId: z.string().min(1),
  dayId: z.string().min(1),
  itemId: z.string().min(1),
});

export async function PATCH(request: Request, context: ItemCtx) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(await context.params, paramsSchema);
    const data = await parseJsonBody(request, updateItineraryItemSchema);
    const trip = await updateItineraryItemService({
      ownerId,
      tripId: params.tripId,
      dayId: params.dayId,
      itemId: params.itemId,
      data,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request, context: ItemCtx) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(await context.params, paramsSchema);
    const trip = await deleteItineraryItemService({
      ownerId,
      tripId: params.tripId,
      dayId: params.dayId,
      itemId: params.itemId,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
