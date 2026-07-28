import { exploreListQuerySchema } from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/auth/session";
import { listExploreTrips } from "@/server/application/traveler/explore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const url = new URL(request.url);
    const query = exploreListQuerySchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const viewerId = await getSessionUserId();
    const result = await listExploreTrips({
      viewerId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
