import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { getTravelerProfileSummary } from "@/server/application/traveler/explore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const userId = await requireSessionUserId();
    const profile = await getTravelerProfileSummary(userId);
    return jsonOk({ profile }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
