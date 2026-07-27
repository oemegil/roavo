import { regenerateDaySchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { aiEditRateLimiter } from "@/lib/auth/rate-limit";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { regenerateTripDayService } from "@/server/application/ai/itinerary-editing";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ tripId: string; dayId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { tripId, dayId } = await context.params;
    try {
      aiEditRateLimiter.consume(`ai-regen:${userId}`);
    } catch {
      throw new AppError({
        code: "AI_RATE_LIMITED",
        message: "Too many AI requests. Please wait a moment.",
        status: 429,
      });
    }
    const body = await parseJsonBody(request, regenerateDaySchema);
    const result = await regenerateTripDayService({
      userId,
      tripId,
      dayId,
      instruction: body.instruction,
      preserveManualItems: body.preserveManualItems,
      expectedTripVersion: body.expectedTripVersion,
      correlationId,
      signal: request.signal,
    });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
