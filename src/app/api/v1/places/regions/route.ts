import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listRegions } from "@/server/domain/places/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    return jsonOk({ regions: listRegions() }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
