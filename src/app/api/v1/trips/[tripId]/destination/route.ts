import {
  clearTripDestinationSchema,
  selectTripDestinationSchema,
} from "@/features/destinations/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import {
  clearTripDestinationService,
  selectTripDestinationService,
} from "@/server/application/destinations/trip-destination";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ tripId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = await context.params;
    const data = await parseJsonBody(request, selectTripDestinationSchema);
    const result = await selectTripDestinationService({
      tripId,
      ownerId,
      data,
      correlationId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const { tripId } = await context.params;
    let confirmItineraryWarning: boolean | undefined;
    try {
      const body = await parseJsonBody(request, clearTripDestinationSchema);
      confirmItineraryWarning = body.confirmItineraryWarning;
    } catch {
      // Empty body is allowed for clear without itinerary items.
      confirmItineraryWarning = undefined;
    }
    const result = await clearTripDestinationService({
      tripId,
      ownerId,
      confirmItineraryWarning,
      correlationId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
