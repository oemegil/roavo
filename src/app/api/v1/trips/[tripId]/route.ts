import { z } from "zod";

import { updateTripSchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams } from "@/lib/validation/http";
import { getTripService } from "@/server/application/trips/get-trip";
import { updateTripService } from "@/server/application/trips/update-trip";
import { deleteTripService } from "@/server/application/trips/lifecycle";

export const runtime = "nodejs";

const paramsSchema = z.object({ tripId: z.string().min(1) });

type RouteContext = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    const trip = await getTripService({ ownerId, tripId });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    const data = await parseJsonBody(request, updateTripSchema);
    const trip = await updateTripService({ ownerId, tripId, data, correlationId });
    return jsonOk({ trip }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    await deleteTripService({ ownerId, tripId, correlationId });
    return new Response(null, {
      status: 204,
      headers: { "x-correlation-id": correlationId },
    });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
