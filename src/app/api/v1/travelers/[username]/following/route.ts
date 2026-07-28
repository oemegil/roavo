import { followListQuerySchema } from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/auth/session";
import { listFollowing } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const { username } = await params;
    const url = new URL(request.url);
    const query = followListQuerySchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const viewerId = await getSessionUserId();
    const result = await listFollowing({
      username,
      viewerId,
      cursor: query.cursor,
      limit: query.limit,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
