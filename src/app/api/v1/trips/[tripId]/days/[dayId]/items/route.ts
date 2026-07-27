import { z } from "zod";

import { createItineraryItemSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { createItineraryItemService } from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

type DayCtx = { params: Promise<{ tripId: string; dayId: string }> };

export async function POST(request: Request, context: DayCtx) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(
      await context.params,
      z.object({ tripId: z.string().min(1), dayId: z.string().min(1) }),
    );
    const data = await parseJsonBody(request, createItineraryItemSchema);
    const trip = await createItineraryItemService({
      ownerId,
      tripId: params.tripId,
      dayId: params.dayId,
      data,
    });
    return jsonOk({ trip }, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
