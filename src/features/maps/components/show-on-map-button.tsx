"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { MapPin } from "@/features/maps/components/itinerary-map";
import {
  buildGoogleMapsDirectionsUrl,
  buildPlanKml,
  downloadKmlFile,
  type PlanMapPin,
} from "@/features/maps/google-export";
import { Button } from "@/components/ui/button";

const ItineraryMap = dynamic(
  () =>
    import("@/features/maps/components/itinerary-map").then((mod) => mod.ItineraryMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted text-muted-foreground flex h-80 items-center justify-center rounded-xl border text-sm">
        Harita yükleniyor…
      </div>
    ),
  },
);

type PlaceInput = {
  name: string;
  city?: string | null;
  dayNumber?: number;
  dayLabel?: string;
};

export function ShowOnMapButton({
  places,
  readyPins,
  planTitle = "Roavo planı",
}: {
  /** Full-plan places to geocode (preview). */
  places?: PlaceInput[];
  /** Already-geocoded pins for the whole plan. */
  readyPins?: MapPin[];
  planTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pins, setPins] = useState<PlanMapPin[]>(readyPins ?? []);

  const placeCount = places?.length ?? readyPins?.length ?? 0;
  const canShow = placeCount > 0;

  const label = useMemo(() => {
    if (loading) return "Harita hazırlanıyor…";
    if (open) return "Haritayı gizle";
    return "Tüm planı haritada göster";
  }, [loading, open]);

  const googleUrl = useMemo(
    () => (pins.length > 0 ? buildGoogleMapsDirectionsUrl(pins) : null),
    [pins],
  );

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    if (readyPins && readyPins.length > 0) {
      setPins(readyPins);
      setOpen(true);
      return;
    }

    if (!places || places.length === 0) {
      setError("Bu planda pinlenecek yer yok.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: places.map((place) => ({
            name: place.name,
            city: place.city ?? null,
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Konumlar bulunamadı. Biraz sonra dene.");
        return;
      }

      const nextPins: PlanMapPin[] = [];
      const geocoded = payload.places ?? [];
      for (let index = 0; index < places.length; index += 1) {
        const place = places[index]!;
        const hit = geocoded[index] as
          | {
              found?: boolean;
              latitude?: number | null;
              longitude?: number | null;
              name?: string;
              city?: string | null;
            }
          | undefined;
        if (!hit?.found || hit.latitude == null || hit.longitude == null) {
          continue;
        }
        nextPins.push({
          id: `${place.dayNumber ?? "d"}-${place.name}-${index}`,
          name: place.name,
          latitude: hit.latitude,
          longitude: hit.longitude,
          subtitle: place.city ?? hit.city ?? null,
          dayNumber: place.dayNumber,
          dayLabel:
            place.dayLabel ??
            (place.dayNumber != null ? `Gün ${place.dayNumber}` : undefined),
        });
      }

      setPins(nextPins);
      setOpen(true);
      if (nextPins.length === 0) {
        setError("Hiçbir yer OpenStreetMap’te bulunamadı.");
      }
    } catch {
      setError("Harita isteği başarısız oldu.");
    } finally {
      setLoading(false);
    }
  }

  function exportToGoogleMyMaps() {
    if (pins.length === 0) return;
    const kml = buildPlanKml({
      title: planTitle,
      description: "Roavo gezi planı — Google My Maps’e içe aktarılabilir",
      pins,
    });
    const safeName = planTitle
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\-]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    downloadKmlFile(safeName || "roavo-plan", kml);
  }

  if (!canShow) return null;

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void toggle()}
        disabled={loading}
      >
        {label}
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      {open ? (
        <div className="gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <ItineraryMap pins={pins} className="h-80 lg:h-[28rem]" />
          <aside className="space-y-3 rounded-xl border p-3 text-sm">
            <p className="font-medium">Google Maps</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Haritadaki yerleri Google’da açabilir veya My Maps’e aktarmak için KML
              indirebilirsin.
            </p>
            {googleUrl ? (
              <Button type="button" size="sm" className="w-full" asChild>
                <a href={googleUrl} target="_blank" rel="noreferrer">
                  Google Maps’te aç
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={exportToGoogleMyMaps}
              disabled={pins.length === 0}
            >
              Google My Maps’e aktar (KML)
            </Button>
            <ol className="text-muted-foreground list-decimal space-y-1 pl-4 text-[11px] leading-relaxed">
              <li>KML dosyasını indir</li>
              <li>
                <a
                  className="underline underline-offset-2"
                  href="https://www.google.com/maps/d/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google My Maps
                </a>{" "}
                aç
              </li>
              <li>Yeni harita → İçe aktar → KML seç</li>
            </ol>
            <p className="text-muted-foreground text-[11px]">
              {pins.length} konum · pin numarası günü gösterir
            </p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
