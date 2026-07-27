import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listFeaturedDestinationsService } from "@/server/application/destinations/list-featured";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const result = await listFeaturedDestinationsService({ correlationId });
    return jsonOk(result, {
      correlationId,
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
