import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { searchPlanCities } from "@/server/domain/places/plan-cities";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const cities = searchPlanCities(q, 25).map((city) => ({
      id: city.id,
      name: city.name,
      nameTr: city.nameTr,
      countryCode: city.countryCode,
      iata: city.nearestAirportIata ?? null,
      latitude: city.latitude ?? null,
      longitude: city.longitude ?? null,
      hasAirport: Boolean(city.nearestAirportIata),
    }));
    return jsonOk({ cities }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
