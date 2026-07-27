import { generateItinerarySchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { aiGenerationRateLimiter } from "@/lib/auth/rate-limit";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { generateItineraryPreviewService } from "@/server/application/ai/itinerary-generation";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { tripId } = await context.params;
    try {
      aiGenerationRateLimiter.consume(`ai-generate:${userId}`);
    } catch {
      throw new AppError({
        code: "AI_RATE_LIMITED",
        message: "Too many itinerary generation requests. Please wait a moment.",
        status: 429,
      });
    }
    const body = await parseJsonBody(request, generateItinerarySchema);
    const result = await generateItineraryPreviewService({
      userId,
      tripId,
      expectedTripVersion: body.expectedTripVersion,
      existingItemsPolicy: body.existingItemsPolicy,
      correlationId,
      signal: request.signal,
    });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
