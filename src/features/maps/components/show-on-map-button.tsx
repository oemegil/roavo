"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { MapPin } from "@/features/maps/components/itinerary-map";
import { Button } from "@/components/ui/button";

const ItineraryMap = dynamic(
  () =>
    import("@/features/maps/components/itinerary-map").then((mod) => mod.ItineraryMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted text-muted-foreground flex h-72 items-center justify-center rounded-xl border text-sm">
        Harita yükleniyor…
      </div>
    ),
  },
);

type PlaceInput = {
  name: string;
  city?: string | null;
};

export function ShowOnMapButton({
  places,
  readyPins,
}: {
  /** Geocode these via API when opened (preview flow). */
  places?: PlaceInput[];
  /** Already-geocoded pins (saved trip items). */
  readyPins?: MapPin[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pins, setPins] = useState<MapPin[]>(readyPins ?? []);

  const placeCount = places?.length ?? readyPins?.length ?? 0;
  const canShow = placeCount > 0;

  const label = useMemo(() => {
    if (loading) return "Harita hazırlanıyor…";
    if (open) return "Haritayı gizle";
    return "Haritada göster";
  }, [loading, open]);

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
      setError("Bu gün için pinlenecek yer yok.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Konumlar bulunamadı. Biraz sonra dene.");
        return;
      }
      const nextPins: MapPin[] = (payload.places ?? [])
        .filter(
          (place: {
            found?: boolean;
            latitude?: number | null;
            longitude?: number | null;
          }) => place.found && place.latitude != null && place.longitude != null,
        )
        .map(
          (
            place: {
              name: string;
              city?: string | null;
              latitude: number;
              longitude: number;
            },
            index: number,
          ) => ({
            id: `${place.name}-${index}`,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            subtitle: place.city ?? null,
          }),
        );
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
      {open ? <ItineraryMap pins={pins} /> : null}
    </div>
  );
}
