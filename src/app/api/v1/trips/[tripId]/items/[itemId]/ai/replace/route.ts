import { replaceItemSchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { aiEditRateLimiter } from "@/lib/auth/rate-limit";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { replaceItineraryItemService } from "@/server/application/ai/itinerary-editing";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ tripId: string; itemId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { tripId, itemId } = await context.params;
    try {
      aiEditRateLimiter.consume(`ai-replace:${userId}`);
    } catch {
      throw new AppError({
        code: "AI_RATE_LIMITED",
        message: "Too many AI requests. Please wait a moment.",
        status: 429,
      });
    }
    const body = await parseJsonBody(request, replaceItemSchema);
    const result = await replaceItineraryItemService({
      userId,
      tripId,
      itemId,
      instruction: body.instruction,
      expectedTripVersion: body.expectedTripVersion,
      correlationId,
      signal: request.signal,
    });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
