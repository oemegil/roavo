import "server-only";

import planCitiesJson from "@/server/domain/places/data/plan-cities.json";

export type PlanCity = {
  id: string;
  name: string;
  nameTr: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  nearestAirportIata?: string;
};

export const PLAN_CITIES = planCitiesJson as PlanCity[];

const byId = new Map(PLAN_CITIES.map((city) => [city.id, city]));

function normalize(text: string) {
  return text.trim().toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "");
}

export function resolvePlanCitiesByIds(ids: string[]): PlanCity[] {
  const found: PlanCity[] = [];
  for (const id of ids) {
    const city = byId.get(id);
    if (city) found.push(city);
  }
  return found;
}

export function getPlanCityById(id: string): PlanCity | null {
  return byId.get(id) ?? null;
}

/** Typeahead search over the plan-city catalog (no airport required). */
export function searchPlanCities(query: string, limit = 20): PlanCity[] {
  const q = normalize(query);
  if (!q) {
    return PLAN_CITIES.slice(0, Math.min(limit, 12));
  }

  const scored: Array<{ city: PlanCity; score: number }> = [];
  for (const city of PLAN_CITIES) {
    const name = normalize(city.name);
    const nameTr = normalize(city.nameTr);
    const code = city.countryCode.toLowerCase();
    let score = 0;
    if (nameTr === q || name === q) score = 100;
    else if (nameTr.startsWith(q) || name.startsWith(q)) score = 80;
    else if (nameTr.includes(q) || name.includes(q)) score = 50;
    else if (code === q) score = 30;
    else continue;
    scored.push({ city, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.city.nameTr.localeCompare(b.city.nameTr, "tr"))
    .slice(0, limit)
    .map((row) => row.city);
}
