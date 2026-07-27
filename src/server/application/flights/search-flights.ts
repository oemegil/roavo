import "server-only";

import { searchIgnavFares } from "@/integrations/flights/ignav-client";
import type {
  FlightCityRef,
  FlightOptionDto,
  IgnavItinerary,
  OpenJawCandidate,
} from "@/integrations/flights/types";

function toCityRef(city: { name: string; nameTr: string; iata: string; countryCode: string }): FlightCityRef {
  return {
    name: city.nameTr || city.name,
    iata: city.iata,
    countryCode: city.countryCode,
  };
}

function buildCandidates(input: {
  originIata: string;
  originName: string;
  cities: Array<{ name: string; nameTr: string; iata: string; countryCode: string }>;
  startDate: string;
  endDate: string;
}): OpenJawCandidate[] {
  const cities = input.cities.map(toCityRef);
  const candidates: OpenJawCandidate[] = [];

  if (cities.length === 1) {
    const city = cities[0]!;
    candidates.push({
      entryCity: city,
      exitCity: city,
      outboundOrigin: input.originIata,
      outboundDest: city.iata,
      returnOrigin: city.iata,
      returnDest: input.originIata,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    return candidates;
  }

  for (const entry of cities) {
    for (const exit of cities) {
      if (cities.length >= 2 && entry.iata === exit.iata) {
        continue;
      }
      candidates.push({
        entryCity: entry,
        exitCity: exit,
        outboundOrigin: input.originIata,
        outboundDest: entry.iata,
        returnOrigin: exit.iata,
        returnDest: input.originIata,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }
  }

  return candidates;
}

function segmentSummary(leg: IgnavItinerary["legs"][number] | undefined) {
  const segments = leg?.segments ?? [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  const carrier =
    first?.operating_carrier_name ||
    leg?.carrier ||
    first?.marketing_carrier_code ||
    null;

  const stopAirports: string[] = [];
  for (let i = 0; i < segments.length - 1; i += 1) {
    const arrival = segments[i]?.arrival_airport;
    const nextDeparture = segments[i + 1]?.departure_airport;
    const airport = arrival || nextDeparture;
    if (airport && !stopAirports.includes(airport)) {
      stopAirports.push(airport);
    }
  }

  return {
    carrier,
    durationMinutes: leg?.duration_minutes ?? null,
    departureTime: first?.departure_time_local ?? null,
    arrivalTime: last?.arrival_time_local ?? null,
    stops: Math.max(0, segments.length - 1),
    stopAirports,
  };
}

function toFlightOption(
  candidate: OpenJawCandidate,
  originName: string,
  itinerary: IgnavItinerary,
): FlightOptionDto {
  const outboundLeg = itinerary.legs[0];
  const returnLeg = itinerary.legs[1];
  const outboundSummary = segmentSummary(outboundLeg);
  const returnSummary = segmentSummary(returnLeg);

  const routeSummary =
    candidate.entryCity.iata === candidate.exitCity.iata
      ? `${originName} → ${candidate.entryCity.name} gidiş-dönüş`
      : `${originName} → ${candidate.entryCity.name} gidiş, ${candidate.exitCity.name} → ${originName} dönüş`;

  return {
    entryCity: candidate.entryCity,
    exitCity: candidate.exitCity,
    routeSummary,
    priceAmount: itinerary.price.amount,
    priceCurrency: itinerary.price.currency,
    priceStatus: itinerary.price.status,
    ignavId: itinerary.ignav_id,
    outbound: {
      origin: candidate.outboundOrigin,
      destination: candidate.outboundDest,
      date: candidate.startDate,
      ...outboundSummary,
    },
    return: {
      origin: candidate.returnOrigin,
      destination: candidate.returnDest,
      date: candidate.endDate,
      ...returnSummary,
    },
    requiresSelfTransfer: itinerary.requires_self_transfer,
  };
}

export async function searchBestOpenJawFlights(input: {
  originIata: string;
  originName: string;
  cities: Array<{ name: string; nameTr: string; iata: string; countryCode: string }>;
  startDate: string;
  endDate: string;
  adults?: number;
  signal?: AbortSignal;
  /** When true, only search round-trips to each city (no open-jaw matrix). */
  roundTripOnly?: boolean;
}): Promise<{ options: FlightOptionDto[]; best: FlightOptionDto | null }> {
  const candidates = input.roundTripOnly
    ? input.cities.map((city) => {
        const ref = toCityRef(city);
        return {
          entryCity: ref,
          exitCity: ref,
          outboundOrigin: input.originIata,
          outboundDest: ref.iata,
          returnOrigin: ref.iata,
          returnDest: input.originIata,
          startDate: input.startDate,
          endDate: input.endDate,
        } satisfies OpenJawCandidate;
      })
    : buildCandidates(input);

  const settled = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const response = await searchIgnavFares(
        {
          legs: [
            {
              origin: candidate.outboundOrigin,
              destination: candidate.outboundDest,
              departure_date: candidate.startDate,
            },
            {
              origin: candidate.returnOrigin,
              destination: candidate.returnDest,
              departure_date: candidate.endDate,
            },
          ],
          adults: input.adults ?? 1,
          market: "TR",
        },
        input.signal,
      );
      const bestItinerary = response.itineraries[0];
      if (!bestItinerary) return null;
      return toFlightOption(candidate, input.originName, bestItinerary);
    }),
  );

  const options = settled
    .flatMap((result) =>
      result.status === "fulfilled" && result.value ? [result.value] : [],
    )
    .sort((a, b) => a.priceAmount - b.priceAmount);

  return {
    options,
    best: options[0] ?? null,
  };
}
