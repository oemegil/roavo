import { z } from "zod";

import {
  createTripCommentSchema,
  listTripCommentsQuerySchema,
} from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId, requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseRouteParams, parseWithSchema } from "@/lib/validation/http";
import {
  createTripComment,
  listTripComments,
} from "@/server/application/traveler/comments";

export const runtime = "nodejs";

const paramsSchema = z.object({ tripId: z.string().min(1) });

type RouteContext = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    const url = new URL(request.url);
    const query = parseWithSchema(listTripCommentsQuerySchema, {
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const viewerId = await getSessionUserId();
    const result = await listTripComments({
      tripId,
      viewerId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const { tripId } = parseRouteParams(await context.params, paramsSchema);
    const data = await parseJsonBody(request, createTripCommentSchema);
    const result = await createTripComment({ userId, tripId, data });
    return jsonOk(result, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
