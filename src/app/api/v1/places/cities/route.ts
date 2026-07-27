import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import {
  listAllCatalogCities,
  listCities,
  listCitiesInRegion,
} from "@/server/domain/places/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const params = new URL(request.url).searchParams;
    const regionId = params.get("regionId");
    const countryId = params.get("countryId");
    const all = params.get("all") === "1";

    if (all) {
      return jsonOk({ cities: listAllCatalogCities() }, { correlationId });
    }

    if (regionId && !countryId) {
      return jsonOk({ cities: listCitiesInRegion(regionId) }, { correlationId });
    }

    if (!regionId || !countryId) {
      throw new ValidationError("regionId ve countryId gerekli (veya all=1).");
    }
    return jsonOk({ cities: listCities(regionId, countryId) }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
