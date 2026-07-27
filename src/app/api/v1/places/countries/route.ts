import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { listCountries } from "@/server/domain/places/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const regionId = new URL(request.url).searchParams.get("regionId");
    if (!regionId) {
      throw new ValidationError("regionId gerekli.");
    }
    return jsonOk({ countries: listCountries(regionId) }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
