import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/auth/session";
import { getTravelerPublicProfile } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const { username } = await params;
    const viewerId = await getSessionUserId();
    const profile = await getTravelerPublicProfile({ username, viewerId });
    return jsonOk({ profile }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
