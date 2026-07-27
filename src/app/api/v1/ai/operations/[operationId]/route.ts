import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { findOwnedAiOperation } from "@/server/repositories/ai-repository";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ operationId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const userId = await requireSessionUserId();
    const { operationId } = await context.params;
    const operation = await findOwnedAiOperation(operationId, userId);
    if (!operation) {
      throw new AppError({
        code: "AI_OPERATION_NOT_FOUND",
        message: "AI operation not found.",
        status: 404,
      });
    }
    return jsonOk(
      {
        operation: {
          id: operation.id,
          type: operation.type,
          status: operation.status,
          startedAt: operation.startedAt?.toISOString() ?? null,
          completedAt: operation.completedAt?.toISOString() ?? null,
          errorCode: operation.errorCode,
          retryable:
            operation.status === "FAILED" &&
            ["AI_PROVIDER_TIMEOUT", "AI_PROVIDER_UNAVAILABLE", "AI_PROVIDER_RATE_LIMITED"].includes(
              operation.errorCode ?? "",
            ),
          previewId: operation.previews[0]?.id ?? null,
          hasRecommendation: Boolean(operation.destinationRecommendation),
          promptVersion: operation.promptVersion,
        },
      },
      { correlationId },
    );
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
