"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type { MapPin } from "@/features/maps/components/itinerary-map";
import { buildGoogleMapsPlaceUrl, type PlanMapPin } from "@/features/maps/google-export";
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

export function ShowOnMapButton({
  readyPins,
}: {
  /** Pre-geocoded pins for the whole plan (instant). */
  readyPins: MapPin[];
}) {
  const [open, setOpen] = useState(false);
  const pins = useMemo(() => readyPins ?? [], [readyPins]);
  const showMap = open && pins.length > 0;

  if (pins.length === 0) return null;

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
      >
        {showMap ? "Haritayı gizle" : "Tüm planı haritada göster"}
      </Button>
      {showMap ? (
        <div className="gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_240px]">
          <ItineraryMap pins={pins} className="h-80 lg:h-[28rem]" />
          <aside className="flex max-h-[28rem] flex-col gap-2 rounded-xl border p-3 text-sm">
            <p className="font-medium">Google Maps yerleri</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Her satır Google Maps’te ayrı bir konum olarak açılır (yol tarifi değil).
            </p>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {pins.map((pin) => (
                <li key={pin.id}>
                  <a
                    href={buildGoogleMapsPlaceUrl(pin as PlanMapPin)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:bg-muted block rounded-md px-2 py-1.5 text-xs leading-snug underline-offset-2 hover:underline"
                  >
                    {pin.dayNumber != null ? (
                      <span className="text-muted-foreground">
                        Gün {pin.dayNumber} ·{" "}
                      </span>
                    ) : null}
                    {pin.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-[11px]">
              {pins.length} yer · pin numarası günü gösterir
            </p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
