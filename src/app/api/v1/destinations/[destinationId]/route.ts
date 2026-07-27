import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDestinationByIdService } from "@/server/application/destinations/get-destination";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ destinationId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const { destinationId } = await context.params;
    const destination = await getDestinationByIdService({
      destinationId,
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
