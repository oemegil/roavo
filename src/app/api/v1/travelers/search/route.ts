import { travelerSearchQuerySchema } from "@/features/traveler/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/auth/session";
import { searchTravelers } from "@/server/application/traveler/follow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const url = new URL(request.url);
    const query = travelerSearchQuerySchema.parse({
      q: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const viewerId = await getSessionUserId();
    const result = await searchTravelers({
      query: query.q,
      viewerId,
      limit: query.limit,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
