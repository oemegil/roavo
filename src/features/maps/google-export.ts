export type PlanMapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string | null;
  dayNumber?: number;
  dayLabel?: string;
};

/** Google Maps directions URL (max ~10 waypoints in practice). */
export function buildGoogleMapsDirectionsUrl(pins: PlanMapPin[]): string | null {
  const usable = pins.filter(
    (pin) => Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude),
  );
  if (usable.length === 0) return null;

  if (usable.length === 1) {
    const pin = usable[0]!;
    return `https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`;
  }

  const origin = usable[0]!;
  const destination = usable[usable.length - 1]!;
  const middle = usable.slice(1, -1).slice(0, 8);
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: "walking",
  });
  if (middle.length > 0) {
    params.set(
      "waypoints",
      middle.map((pin) => `${pin.latitude},${pin.longitude}`).join("|"),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** KML for Google My Maps import. */
export function buildPlanKml(input: {
  title: string;
  description?: string;
  pins: PlanMapPin[];
}): string {
  const placemarks = input.pins
    .map((pin) => {
      const name = escapeXml(
        pin.dayNumber != null ? `Gün ${pin.dayNumber} · ${pin.name}` : pin.name,
      );
      const description = escapeXml(
        [pin.dayLabel, pin.subtitle].filter(Boolean).join(" · ") || pin.name,
      );
      return `  <Placemark>
    <name>${name}</name>
    <description>${description}</description>
    <Point><coordinates>${pin.longitude},${pin.latitude},0</coordinates></Point>
  </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${escapeXml(input.title)}</name>
  <description>${escapeXml(input.description ?? "Roavo gezi planı")}</description>
${placemarks}
</Document>
</kml>`;
}

export function downloadKmlFile(filename: string, kml: string) {
  const blob = new Blob([kml], {
    type: "application/vnd.google-earth.kml+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".kml") ? filename : `${filename}.kml`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
