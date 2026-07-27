import { applyPreviewSchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody } from "@/lib/validation/http";
import {
  applyItineraryPreviewService,
  discardItineraryPreviewService,
} from "@/server/application/ai/itinerary-generation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ tripId: string; previewId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { tripId, previewId } = await context.params;
    const body = await parseJsonBody(request, applyPreviewSchema);
    const result = await applyItineraryPreviewService({
      userId,
      tripId,
      previewId,
      expectedTripVersion: body.expectedTripVersion,
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
    const userId = await requireSessionUserId();
    const { tripId, previewId } = await context.params;
    const result = await discardItineraryPreviewService({
      userId,
      tripId,
      previewId,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
