export type IgnavSearchLeg = {
  origin: string;
  destination: string;
  departure_date: string;
  max_stops?: number;
};

export type IgnavSearchRequest = {
  legs: IgnavSearchLeg[];
  adults?: number;
  children?: number;
  cabin_class?: "economy" | "premium_economy" | "business" | "first";
  market?: string;
  allow_self_transfer?: boolean;
};

export type IgnavPrice = {
  amount: number;
  currency: string;
  status: string;
};

export type IgnavSegment = {
  marketing_carrier_code: string;
  flight_number: string;
  operating_carrier_name: string;
  departure_airport: string;
  departure_time_local: string;
  arrival_airport: string;
  arrival_time_local: string;
  duration_minutes: number;
};

export type IgnavItineraryLeg = {
  carrier: string;
  duration_minutes: number;
  segments: IgnavSegment[];
};

export type IgnavItinerary = {
  price: IgnavPrice;
  legs: IgnavItineraryLeg[];
  cabin_class: string;
  requires_self_transfer: boolean;
  ignav_id: string;
};

export type IgnavSearchResponse = {
  legs: IgnavSearchLeg[];
  itineraries: IgnavItinerary[];
};

export type FlightCityRef = {
  name: string;
  iata: string;
  countryCode: string;
};

export type OpenJawCandidate = {
  entryCity: FlightCityRef;
  exitCity: FlightCityRef;
  outboundOrigin: string;
  outboundDest: string;
  returnOrigin: string;
  returnDest: string;
  startDate: string;
  endDate: string;
};

export type FlightOptionDto = {
  entryCity: FlightCityRef;
  exitCity: FlightCityRef;
  routeSummary: string;
  priceAmount: number;
  priceCurrency: string;
  priceStatus: string;
  ignavId: string | null;
  outbound: {
    origin: string;
    destination: string;
    date: string;
    carrier: string | null;
    durationMinutes: number | null;
    departureTime: string | null;
    arrivalTime: string | null;
    stops: number;
    stopAirports: string[];
  };
  return: {
    origin: string;
    destination: string;
    date: string;
    carrier: string | null;
    durationMinutes: number | null;
    departureTime: string | null;
    arrivalTime: string | null;
    stops: number;
    stopAirports: string[];
  };
  requiresSelfTransfer: boolean;
};
