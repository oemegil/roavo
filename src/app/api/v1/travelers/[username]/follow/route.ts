import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { followTraveler, unfollowTraveler } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

type Params = { params: Promise<{ username: string }> };

export async function POST(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const followerId = await requireSessionUserId();
    const { username } = await params;
    const result = await followTraveler({ followerId, username });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const followerId = await requireSessionUserId();
    const { username } = await params;
    const result = await unfollowTraveler({ followerId, username });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
