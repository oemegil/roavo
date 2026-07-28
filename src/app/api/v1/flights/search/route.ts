import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { flightSearchSchema } from "@/features/plan/schemas";
import { AppError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { searchBestOpenJawFlights } from "@/server/application/flights/search-flights";
import {
  listPopularCitiesInRegion,
  resolveCitiesByIds,
} from "@/server/domain/places/catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const body = await parseJsonBody(request, flightSearchSchema);
    const citiesRaw =
      body.mode === "region" && body.regionId
        ? listPopularCitiesInRegion(body.regionId)
        : resolveCitiesByIds(body.cityIds);
    const cities = citiesRaw.filter((city): city is typeof city & { iata: string } =>
      Boolean(city.iata),
    );

    if (cities.length === 0) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message:
          body.mode === "region"
            ? "Bu bölge için aranacak şehir bulunamadı."
            : "En az bir geçerli şehir seç.",
        status: 400,
      });
    }

    const result = await searchBestOpenJawFlights({
      originIata: body.originIata,
      originName: body.originName,
      cities,
      startDate: body.startDate,
      endDate: body.endDate,
      adults: body.adults,
      roundTripOnly: body.mode === "region",
    });

    if (!result.best) {
      throw new AppError({
        code: "NOT_FOUND",
        message:
          "Bu rota için uçuş bulunamadı. Tarihleri veya şehirleri değiştirmeyi dene.",
        status: 404,
      });
    }

    return jsonOk(
      {
        options: result.options,
        best: result.best,
        alternatives: result.options.slice(1),
        searchedCityCount: cities.length,
        mode: body.mode,
      },
      { correlationId },
    );
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
