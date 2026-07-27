import { z } from "zod";

import { updateTripDaySchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { updateTripDayService } from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string; dayId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const params = parseRouteParams(
      await context.params,
      z.object({ tripId: z.string().min(1), dayId: z.string().min(1) }),
    );
    const data = await parseJsonBody(request, updateTripDaySchema);
    const trip = await updateTripDayService({
      ownerId,
      tripId: params.tripId,
      dayId: params.dayId,
      title: data.title,
      notes: data.notes,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
