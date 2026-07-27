export const DESTINATION_LIMITS = {
  nameMin: 1,
  nameMax: 120,
  shortDescriptionMax: 240,
  longDescriptionMax: 3000,
  practicalNotesMax: 2000,
  searchQueryMin: 2,
  searchQueryMax: 100,
  searchDefaultLimit: 20,
  searchMaxLimit: 50,
  featuredDefaultLimit: 12,
  slugMax: 80,
  keywordsMax: 20,
  keywordMaxLength: 40,
  maxRecommendedDays: 30,
} as const;

/** Catalog destination geographic/entity type (not Trip preference tags). */
export const CATALOG_DESTINATION_TYPES = [
  "CITY",
  "TOWN",
  "REGION",
  "ISLAND",
  "COASTAL_AREA",
  "NATIONAL_PARK",
  "DESTINATION_CLUSTER",
] as const;

export const DESTINATION_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const DESTINATION_BUDGET_LEVELS = [
  "BUDGET",
  "MODERATE",
  "PREMIUM",
  "LUXURY",
] as const;

export const DESTINATION_CATEGORIES = [
  "ART_AND_CULTURE",
  "HISTORY",
  "FOOD",
  "BEACH",
  "NATURE",
  "NIGHTLIFE",
  "SHOPPING",
  "ARCHITECTURE",
  "ADVENTURE",
  "RELAXATION",
  "FAMILY",
  "ROMANTIC",
  "PHOTOGRAPHY",
  "WELLNESS",
  "WINTER",
  "ROAD_TRIP",
] as const;

export const DESTINATION_BEST_FOR = [
  "FIRST_TIME_VISITORS",
  "COUPLES",
  "SOLO_TRAVELERS",
  "FAMILIES",
  "FRIEND_GROUPS",
  "BUDGET_TRAVELERS",
  "LUXURY_TRAVELERS",
  "WEEKEND_TRIPS",
  "LONG_STAYS",
  "REMOTE_WORK",
  "FOOD_TRIPS",
  "CULTURAL_TRIPS",
  "BEACH_HOLIDAYS",
] as const;

export const DESTINATION_LOCATION_SOURCES = ["CATALOG", "MANUAL"] as const;

export const DESTINATION_PROVIDERS = [
  "MANUAL",
  "GEONAMES",
  "MAPBOX",
  "GOOGLE_PLACES",
  "OPENSTREETMAP",
  "CUSTOM",
] as const;

export const DESTINATION_CATEGORY_LABELS: Record<
  (typeof DESTINATION_CATEGORIES)[number],
  string
> = {
  ART_AND_CULTURE: "Sanat ve kültür",
  HISTORY: "Tarih",
  FOOD: "Yemek",
  BEACH: "Plaj",
  NATURE: "Doğa",
  NIGHTLIFE: "Gece hayatı",
  SHOPPING: "Alışveriş",
  ARCHITECTURE: "Mimari",
  ADVENTURE: "Macera",
  RELAXATION: "Dinlenme",
  FAMILY: "Aile",
  ROMANTIC: "Romantik",
  PHOTOGRAPHY: "Fotoğraf",
  WELLNESS: "Sağlık ve wellness",
  WINTER: "Kış",
  ROAD_TRIP: "Karayolu gezisi",
};

export const DESTINATION_BEST_FOR_LABELS: Record<
  (typeof DESTINATION_BEST_FOR)[number],
  string
> = {
  FIRST_TIME_VISITORS: "İlk kez gidenler",
  COUPLES: "Çiftler",
  SOLO_TRAVELERS: "Yalnız gezginler",
  FAMILIES: "Aileler",
  FRIEND_GROUPS: "Arkadaş grupları",
  BUDGET_TRAVELERS: "Bütçe dostu gezginler",
  LUXURY_TRAVELERS: "Lüks gezginler",
  WEEKEND_TRIPS: "Hafta sonu gezileri",
  LONG_STAYS: "Uzun konaklamalar",
  REMOTE_WORK: "Uzaktan çalışma",
  FOOD_TRIPS: "Yemek gezileri",
  CULTURAL_TRIPS: "Kültür gezileri",
  BEACH_HOLIDAYS: "Plaj tatilleri",
};

export const DESTINATION_BUDGET_LABELS: Record<
  (typeof DESTINATION_BUDGET_LEVELS)[number],
  string
> = {
  BUDGET: "Ekonomik",
  MODERATE: "Orta",
  PREMIUM: "Üst segment",
  LUXURY: "Lüks",
};

export const CATALOG_DESTINATION_TYPE_LABELS: Record<
  (typeof CATALOG_DESTINATION_TYPES)[number],
  string
> = {
  CITY: "Şehir",
  TOWN: "Kasaba",
  REGION: "Bölge",
  ISLAND: "Ada",
  COASTAL_AREA: "Sahil bölgesi",
  NATIONAL_PARK: "Milli park",
  DESTINATION_CLUSTER: "Destinasyon kümesi",
};

/**
 * Overlap map between Trip preference tags (`destinationTypes` / interests)
 * and Destination catalog categories. Concepts are related but not identical.
 */
export const TRIP_PREFERENCE_TO_DESTINATION_CATEGORY: Record<string, string> = {
  CITY: "ARCHITECTURE",
  BEACH: "BEACH",
  NATURE: "NATURE",
  MOUNTAIN: "NATURE",
  HISTORICAL: "HISTORY",
  CULTURAL: "ART_AND_CULTURE",
  NIGHTLIFE: "NIGHTLIFE",
  FOOD: "FOOD",
  ROAD_TRIP: "ROAD_TRIP",
  RELAXATION: "RELAXATION",
  ART: "ART_AND_CULTURE",
  HISTORY: "HISTORY",
  ARCHITECTURE: "ARCHITECTURE",
  SHOPPING: "SHOPPING",
  PHOTOGRAPHY: "PHOTOGRAPHY",
  ADVENTURE: "ADVENTURE",
  WELLNESS: "WELLNESS",
  FAMILY: "FAMILY",
  ROMANTIC: "ROMANTIC",
};

export type CatalogDestinationType = (typeof CATALOG_DESTINATION_TYPES)[number];
export type DestinationStatus = (typeof DESTINATION_STATUSES)[number];
export type DestinationBudgetLevel = (typeof DESTINATION_BUDGET_LEVELS)[number];
export type DestinationCategory = (typeof DESTINATION_CATEGORIES)[number];
export type DestinationBestFor = (typeof DESTINATION_BEST_FOR)[number];
export type DestinationLocationSource =
  (typeof DESTINATION_LOCATION_SOURCES)[number];
