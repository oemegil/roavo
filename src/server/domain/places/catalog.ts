export type PlaceCity = {
  id: string;
  name: string;
  nameTr: string;
  countryCode: string;
  iata: string;
  destinationSlug?: string;
  /** Higher = preferred in region-wide fare browsing */
  popularity?: number;
};

export type PlaceCountry = {
  id: string;
  name: string;
  nameTr: string;
  countryCode: string;
  cities: PlaceCity[];
};

export type PlaceRegion = {
  id: string;
  name: string;
  nameTr: string;
  countries: PlaceCountry[];
};

/** Curated hierarchy for Google Flights-style browsing. IATA = primary airport. */
export const PLACE_CATALOG: PlaceRegion[] = [
  {
    id: "europe",
    name: "Europe",
    nameTr: "Avrupa",
    countries: [
      {
        id: "it",
        name: "Italy",
        nameTr: "İtalya",
        countryCode: "IT",
        cities: [
          { id: "rome", name: "Rome", nameTr: "Roma", countryCode: "IT", iata: "FCO", destinationSlug: "rome", popularity: 100 },
          { id: "milan", name: "Milan", nameTr: "Milano", countryCode: "IT", iata: "MXP", popularity: 92 },
          { id: "florence", name: "Florence", nameTr: "Floransa", countryCode: "IT", iata: "FLR", popularity: 80 },
          { id: "venice", name: "Venice", nameTr: "Venedik", countryCode: "IT", iata: "VCE", popularity: 85 },
          { id: "naples", name: "Naples", nameTr: "Napoli", countryCode: "IT", iata: "NAP", popularity: 72 },
          { id: "bologna", name: "Bologna", nameTr: "Bologna", countryCode: "IT", iata: "BLQ", popularity: 60 },
          { id: "palermo", name: "Palermo", nameTr: "Palermo", countryCode: "IT", iata: "PMO", popularity: 58 },
        ],
      },
      {
        id: "es",
        name: "Spain",
        nameTr: "İspanya",
        countryCode: "ES",
        cities: [
          { id: "barcelona", name: "Barcelona", nameTr: "Barselona", countryCode: "ES", iata: "BCN", destinationSlug: "barcelona", popularity: 98 },
          { id: "madrid", name: "Madrid", nameTr: "Madrid", countryCode: "ES", iata: "MAD", popularity: 95 },
          { id: "seville", name: "Seville", nameTr: "Sevilla", countryCode: "ES", iata: "SVQ", popularity: 78 },
          { id: "valencia", name: "Valencia", nameTr: "Valencia", countryCode: "ES", iata: "VLC", popularity: 74 },
          { id: "malaga", name: "Malaga", nameTr: "Malaga", countryCode: "ES", iata: "AGP", popularity: 70 },
          { id: "bilbao", name: "Bilbao", nameTr: "Bilbao", countryCode: "ES", iata: "BIO", popularity: 55 },
        ],
      },
      {
        id: "fr",
        name: "France",
        nameTr: "Fransa",
        countryCode: "FR",
        cities: [
          { id: "paris", name: "Paris", nameTr: "Paris", countryCode: "FR", iata: "CDG", popularity: 100 },
          { id: "nice", name: "Nice", nameTr: "Nice", countryCode: "FR", iata: "NCE", popularity: 82 },
          { id: "lyon", name: "Lyon", nameTr: "Lyon", countryCode: "FR", iata: "LYS", popularity: 68 },
          { id: "marseille", name: "Marseille", nameTr: "Marsilya", countryCode: "FR", iata: "MRS", popularity: 62 },
          { id: "bordeaux", name: "Bordeaux", nameTr: "Bordeaux", countryCode: "FR", iata: "BOD", popularity: 58 },
        ],
      },
      {
        id: "gr",
        name: "Greece",
        nameTr: "Yunanistan",
        countryCode: "GR",
        cities: [
          { id: "athens", name: "Athens", nameTr: "Atina", countryCode: "GR", iata: "ATH", popularity: 90 },
          { id: "santorini", name: "Santorini", nameTr: "Santorini", countryCode: "GR", iata: "JTR", popularity: 84 },
          { id: "mykonos", name: "Mykonos", nameTr: "Mykonos", countryCode: "GR", iata: "JMK", popularity: 76 },
          { id: "thessaloniki", name: "Thessaloniki", nameTr: "Selanik", countryCode: "GR", iata: "SKG", popularity: 70 },
          { id: "crete", name: "Heraklion", nameTr: "Girit (Heraklion)", countryCode: "GR", iata: "HER", popularity: 72 },
        ],
      },
      {
        id: "pt",
        name: "Portugal",
        nameTr: "Portekiz",
        countryCode: "PT",
        cities: [
          { id: "lisbon", name: "Lisbon", nameTr: "Lizbon", countryCode: "PT", iata: "LIS", popularity: 88 },
          { id: "porto", name: "Porto", nameTr: "Porto", countryCode: "PT", iata: "OPO", popularity: 80 },
          { id: "faro", name: "Faro", nameTr: "Faro", countryCode: "PT", iata: "FAO", popularity: 60 },
        ],
      },
      {
        id: "de",
        name: "Germany",
        nameTr: "Almanya",
        countryCode: "DE",
        cities: [
          { id: "berlin", name: "Berlin", nameTr: "Berlin", countryCode: "DE", iata: "BER", popularity: 90 },
          { id: "munich", name: "Munich", nameTr: "Münih", countryCode: "DE", iata: "MUC", popularity: 86 },
          { id: "frankfurt", name: "Frankfurt", nameTr: "Frankfurt", countryCode: "DE", iata: "FRA", popularity: 75 },
          { id: "hamburg", name: "Hamburg", nameTr: "Hamburg", countryCode: "DE", iata: "HAM", popularity: 65 },
        ],
      },
      {
        id: "nl",
        name: "Netherlands",
        nameTr: "Hollanda",
        countryCode: "NL",
        cities: [
          { id: "amsterdam", name: "Amsterdam", nameTr: "Amsterdam", countryCode: "NL", iata: "AMS", popularity: 94 },
          { id: "rotterdam", name: "Rotterdam", nameTr: "Rotterdam", countryCode: "NL", iata: "RTM", popularity: 50 },
        ],
      },
      {
        id: "gb",
        name: "United Kingdom",
        nameTr: "Birleşik Krallık",
        countryCode: "GB",
        cities: [
          { id: "london", name: "London", nameTr: "Londra", countryCode: "GB", iata: "LHR", popularity: 100 },
          { id: "edinburgh", name: "Edinburgh", nameTr: "Edinburgh", countryCode: "GB", iata: "EDI", popularity: 72 },
          { id: "manchester", name: "Manchester", nameTr: "Manchester", countryCode: "GB", iata: "MAN", popularity: 68 },
        ],
      },
      {
        id: "at",
        name: "Austria",
        nameTr: "Avusturya",
        countryCode: "AT",
        cities: [
          { id: "vienna", name: "Vienna", nameTr: "Viyana", countryCode: "AT", iata: "VIE", popularity: 88 },
          { id: "salzburg", name: "Salzburg", nameTr: "Salzburg", countryCode: "AT", iata: "SZG", popularity: 58 },
        ],
      },
      {
        id: "cz",
        name: "Czech Republic",
        nameTr: "Çekya",
        countryCode: "CZ",
        cities: [
          { id: "prague", name: "Prague", nameTr: "Prag", countryCode: "CZ", iata: "PRG", popularity: 90 },
        ],
      },
      {
        id: "hu",
        name: "Hungary",
        nameTr: "Macaristan",
        countryCode: "HU",
        cities: [
          { id: "budapest", name: "Budapest", nameTr: "Budapeşte", countryCode: "HU", iata: "BUD", popularity: 86 },
        ],
      },
      {
        id: "ch",
        name: "Switzerland",
        nameTr: "İsviçre",
        countryCode: "CH",
        cities: [
          { id: "zurich", name: "Zurich", nameTr: "Zürih", countryCode: "CH", iata: "ZRH", popularity: 80 },
          { id: "geneva", name: "Geneva", nameTr: "Cenevre", countryCode: "CH", iata: "GVA", popularity: 70 },
        ],
      },
      {
        id: "be",
        name: "Belgium",
        nameTr: "Belçika",
        countryCode: "BE",
        cities: [
          { id: "brussels", name: "Brussels", nameTr: "Brüksel", countryCode: "BE", iata: "BRU", popularity: 78 },
        ],
      },
      {
        id: "pl",
        name: "Poland",
        nameTr: "Polonya",
        countryCode: "PL",
        cities: [
          { id: "warsaw", name: "Warsaw", nameTr: "Varşova", countryCode: "PL", iata: "WAW", popularity: 74 },
          { id: "krakow", name: "Krakow", nameTr: "Krakow", countryCode: "PL", iata: "KRK", popularity: 72 },
        ],
      },
      {
        id: "hr",
        name: "Croatia",
        nameTr: "Hırvatistan",
        countryCode: "HR",
        cities: [
          { id: "dubrovnik", name: "Dubrovnik", nameTr: "Dubrovnik", countryCode: "HR", iata: "DBV", popularity: 76 },
          { id: "zagreb", name: "Zagreb", nameTr: "Zagreb", countryCode: "HR", iata: "ZAG", popularity: 60 },
        ],
      },
      {
        id: "cy",
        name: "Cyprus",
        nameTr: "Kıbrıs",
        countryCode: "CY",
        cities: [
          { id: "larnaca", name: "Larnaca", nameTr: "Larnaka", countryCode: "CY", iata: "LCA", popularity: 82 },
          { id: "paphos", name: "Paphos", nameTr: "Baf", countryCode: "CY", iata: "PFO", popularity: 68 },
          { id: "ercan", name: "Ercan", nameTr: "Ercan", countryCode: "CY", iata: "ECN", popularity: 88 },
        ],
      },
    ],
  },
  {
    id: "americas",
    name: "Americas",
    nameTr: "Amerika",
    countries: [
      {
        id: "us",
        name: "United States",
        nameTr: "Amerika Birleşik Devletleri",
        countryCode: "US",
        cities: [
          { id: "new-york", name: "New York", nameTr: "New York", countryCode: "US", iata: "JFK", popularity: 100 },
          { id: "miami", name: "Miami", nameTr: "Miami", countryCode: "US", iata: "MIA", popularity: 90 },
          { id: "los-angeles", name: "Los Angeles", nameTr: "Los Angeles", countryCode: "US", iata: "LAX", popularity: 92 },
          { id: "chicago", name: "Chicago", nameTr: "Chicago", countryCode: "US", iata: "ORD", popularity: 78 },
          { id: "san-francisco", name: "San Francisco", nameTr: "San Francisco", countryCode: "US", iata: "SFO", popularity: 80 },
          { id: "boston", name: "Boston", nameTr: "Boston", countryCode: "US", iata: "BOS", popularity: 70 },
          { id: "las-vegas", name: "Las Vegas", nameTr: "Las Vegas", countryCode: "US", iata: "LAS", popularity: 72 },
        ],
      },
      {
        id: "ca",
        name: "Canada",
        nameTr: "Kanada",
        countryCode: "CA",
        cities: [
          { id: "toronto", name: "Toronto", nameTr: "Toronto", countryCode: "CA", iata: "YYZ", popularity: 85 },
          { id: "vancouver", name: "Vancouver", nameTr: "Vancouver", countryCode: "CA", iata: "YVR", popularity: 75 },
          { id: "montreal", name: "Montreal", nameTr: "Montreal", countryCode: "CA", iata: "YUL", popularity: 70 },
        ],
      },
      {
        id: "br",
        name: "Brazil",
        nameTr: "Brezilya",
        countryCode: "BR",
        cities: [
          { id: "sao-paulo", name: "Sao Paulo", nameTr: "Sao Paulo", countryCode: "BR", iata: "GRU", popularity: 80 },
          { id: "rio", name: "Rio de Janeiro", nameTr: "Rio de Janeiro", countryCode: "BR", iata: "GIG", popularity: 82 },
        ],
      },
    ],
  },
  {
    id: "middle-east",
    name: "Middle East",
    nameTr: "Orta Doğu",
    countries: [
      {
        id: "ae",
        name: "United Arab Emirates",
        nameTr: "Birleşik Arap Emirlikleri",
        countryCode: "AE",
        cities: [
          { id: "dubai", name: "Dubai", nameTr: "Dubai", countryCode: "AE", iata: "DXB", popularity: 95 },
          { id: "abu-dhabi", name: "Abu Dhabi", nameTr: "Abu Dabi", countryCode: "AE", iata: "AUH", popularity: 70 },
        ],
      },
      {
        id: "qa",
        name: "Qatar",
        nameTr: "Katar",
        countryCode: "QA",
        cities: [
          { id: "doha", name: "Doha", nameTr: "Doha", countryCode: "QA", iata: "DOH", popularity: 80 },
        ],
      },
    ],
  },
];

/** Max cities for region-wide fare search (Ignav call budget). */
const REGION_POPULAR_LIMITS: Record<string, number> = {
  europe: 24,
  americas: 12,
  "middle-east": 6,
};

/** Turkish and common origin cities for departure search. */
export const ORIGIN_CITIES: PlaceCity[] = [
  { id: "ankara", name: "Ankara", nameTr: "Ankara", countryCode: "TR", iata: "ESB" },
  { id: "istanbul", name: "Istanbul", nameTr: "İstanbul", countryCode: "TR", iata: "IST", destinationSlug: "istanbul" },
  { id: "izmir", name: "Izmir", nameTr: "İzmir", countryCode: "TR", iata: "ADB" },
  { id: "antalya", name: "Antalya", nameTr: "Antalya", countryCode: "TR", iata: "AYT" },
  { id: "adana", name: "Adana", nameTr: "Adana", countryCode: "TR", iata: "ADA" },
  { id: "trabzon", name: "Trabzon", nameTr: "Trabzon", countryCode: "TR", iata: "TZX" },
];

export function listRegions() {
  return PLACE_CATALOG.map(({ id, name, nameTr, countries }) => ({
    id,
    name,
    nameTr,
    countryCount: countries.length,
  }));
}

export function listCountries(regionId: string) {
  const region = PLACE_CATALOG.find((r) => r.id === regionId);
  if (!region) return [];
  return region.countries.map(({ id, name, nameTr, countryCode, cities }) => ({
    id,
    name,
    nameTr,
    countryCode,
    cityCount: cities.length,
  }));
}

export function listCities(regionId: string, countryId: string) {
  const region = PLACE_CATALOG.find((r) => r.id === regionId);
  const country = region?.countries.find((c) => c.id === countryId);
  if (!country) return [];
  return country.cities.map(({ id, name, nameTr, countryCode, iata, destinationSlug }) => ({
    id,
    name,
    nameTr,
    countryCode,
    iata,
    destinationSlug: destinationSlug ?? null,
  }));
}

/** All cities in a region (for combo / Europe-wide search). */
export function listCitiesInRegion(regionId: string) {
  const region = PLACE_CATALOG.find((r) => r.id === regionId);
  if (!region) return [];
  return region.countries.flatMap((country) =>
    country.cities.map(({ id, name, nameTr, countryCode, iata, destinationSlug }) => ({
      id,
      name,
      nameTr,
      countryCode,
      iata,
      destinationSlug: destinationSlug ?? null,
    })),
  );
}

/**
 * Popular cities for region-wide fare browsing (sorted by popularity).
 * Europe uses a higher limit so more destinations appear.
 */
export function listPopularCitiesInRegion(regionId: string): PlaceCity[] {
  const region = PLACE_CATALOG.find((r) => r.id === regionId);
  if (!region) return [];
  const limit = REGION_POPULAR_LIMITS[regionId] ?? 12;
  return region.countries
    .flatMap((country) => country.cities)
    .slice()
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit);
}

export function listAllCatalogCities() {
  const seen = new Set<string>();
  return PLACE_CATALOG.flatMap((region) =>
    region.countries.flatMap((country) =>
      country.cities.flatMap((city) => {
        if (seen.has(city.id)) return [];
        seen.add(city.id);
        return [
          {
            ...city,
            destinationSlug: city.destinationSlug ?? null,
            regionId: region.id,
            countryId: country.id,
          },
        ];
      }),
    ),
  );
}

export function searchOrigins(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return ORIGIN_CITIES.slice(0, 8);
  return ORIGIN_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.nameTr.toLowerCase().includes(q) ||
      city.iata.toLowerCase().includes(q),
  ).slice(0, 10);
}

export function resolveCitiesByIds(cityIds: string[]): PlaceCity[] {
  const found: PlaceCity[] = [];
  for (const id of cityIds) {
    for (const region of PLACE_CATALOG) {
      for (const country of region.countries) {
        const city = country.cities.find((c) => c.id === id);
        if (city) {
          found.push(city);
          break;
        }
      }
    }
  }
  return found;
}

export function resolveOriginByIata(iata: string): PlaceCity | null {
  return ORIGIN_CITIES.find((c) => c.iata === iata.toUpperCase()) ?? null;
}
