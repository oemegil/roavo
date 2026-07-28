export type PlanMapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string | null;
  dayNumber?: number;
  dayLabel?: string;
};

/** Open a single location as a Google Maps place pin (not directions). */
export function buildGoogleMapsPlaceUrl(pin: PlanMapPin): string {
  const query =
    Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude)
      ? `${pin.latitude},${pin.longitude}`
      : [pin.name, pin.subtitle].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    api: "1",
    query,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
