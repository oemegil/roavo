import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { destinationSearchRateLimiter } from "@/lib/auth/rate-limit";
import { parseSearchParams } from "@/lib/validation/http";
import { destinationSearchQuerySchema } from "@/features/destinations/schemas";
import { searchDestinationsService } from "@/server/application/destinations/search-destinations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    destinationSearchRateLimiter.consume(`destination-search:${clientKey}`);

    const url = new URL(request.url);
    const criteria = parseSearchParams(
      url.searchParams,
      destinationSearchQuerySchema,
    );
    const result = await searchDestinationsService({ criteria, correlationId });
    return jsonOk(result, {
      correlationId,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
