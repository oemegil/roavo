import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { searchOrigins } from "@/server/domain/places/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return jsonOk({ origins: searchOrigins(q) }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
