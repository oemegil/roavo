import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDestinationBySlugService } from "@/server/application/destinations/get-destination";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const { slug } = await context.params;
    const destination = await getDestinationBySlugService({
      slug,
      correlationId,
    });
    return jsonOk(
      { destination },
      {
        correlationId,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
