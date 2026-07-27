import { destinationRecommendationInputSchema } from "@/features/ai/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { aiRecommendationRateLimiter } from "@/lib/auth/rate-limit";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { generateDestinationRecommendationsService } from "@/server/application/ai/destination-recommendations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    try {
      aiRecommendationRateLimiter.consume(`ai-recommend:${userId}`);
    } catch {
      throw new AppError({
        code: "AI_RATE_LIMITED",
        message: "Too many AI recommendation requests. Please wait a moment.",
        status: 429,
      });
    }
    const data = await parseJsonBody(request, destinationRecommendationInputSchema);
    const result = await generateDestinationRecommendationsService({
      userId,
      data,
      correlationId,
      signal: request.signal,
    });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
