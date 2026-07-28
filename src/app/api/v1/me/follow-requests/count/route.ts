import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { countPendingFollowRequests } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const count = await countPendingFollowRequests(userId);
    return jsonOk({ count }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
