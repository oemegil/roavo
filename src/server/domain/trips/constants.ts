export const TRIP_LIMITS = {
  maxDurationDays: 30,
  minTravelerCount: 1,
  maxTravelerCount: 20,
  titleMin: 1,
  titleMax: 100,
  descriptionMax: 1000,
  notesMax: 2000,
  dayNotesMax: 1500,
  itemDescriptionMax: 1500,
  itemNotesMax: 1500,
  maxDurationMinutes: 24 * 60,
  listDefaultLimit: 20,
  listMaxLimit: 50,
} as const;

export const DESTINATION_TYPES = [
  "CITY",
  "BEACH",
  "NATURE",
  "MOUNTAIN",
  "HISTORICAL",
  "CULTURAL",
  "NIGHTLIFE",
  "FOOD",
  "ROAD_TRIP",
  "RELAXATION",
] as const;

export const TRAVEL_INTERESTS = [
  "ART",
  "HISTORY",
  "ARCHITECTURE",
  "FOOD",
  "NATURE",
  "SHOPPING",
  "NIGHTLIFE",
  "PHOTOGRAPHY",
  "MUSEUMS",
  "LOCAL_CULTURE",
  "ADVENTURE",
  "WELLNESS",
  "FAMILY",
  "ROMANTIC",
] as const;

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "TRY",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
] as const;

/** Currencies with zero decimal places (ISO 4217). */
export const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND"]);

export type DestinationType = (typeof DESTINATION_TYPES)[number];
export type TravelInterest = (typeof TRAVEL_INTERESTS)[number];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
