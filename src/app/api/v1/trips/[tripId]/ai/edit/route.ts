import { aiEditSchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { aiEditRateLimiter } from "@/lib/auth/rate-limit";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { generateItineraryEditPreviewService } from "@/server/application/ai/itinerary-editing";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { tripId } = await context.params;
    try {
      aiEditRateLimiter.consume(`ai-edit:${userId}`);
    } catch {
      throw new AppError({
        code: "AI_RATE_LIMITED",
        message: "Too many AI edit requests. Please wait a moment.",
        status: 429,
      });
    }
    const body = await parseJsonBody(request, aiEditSchema);
    const result = await generateItineraryEditPreviewService({
      userId,
      tripId,
      instruction: body.instruction,
      scope: body.scope,
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
