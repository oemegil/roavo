import { z } from "zod";

import { reorderDaysSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { reorderTripDaysService } from "@/server/application/trips/itinerary";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = parseRouteParams(
      await context.params,
      z.object({ tripId: z.string().min(1) }),
    );
    const body = await parseJsonBody(request, reorderDaysSchema);
    const trip = await reorderTripDaysService({
      ownerId,
      tripId,
      orderedDayIds: body.orderedDayIds,
    });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
