import { z } from "zod";

import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseRouteParams } from "@/lib/validation/http";
import { deleteTripComment } from "@/server/application/traveler/comments";

export const runtime = "nodejs";

const paramsSchema = z.object({
  tripId: z.string().min(1),
  commentId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ tripId: string; commentId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const { tripId, commentId } = parseRouteParams(await context.params, paramsSchema);
    const result = await deleteTripComment({ userId, tripId, commentId });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
