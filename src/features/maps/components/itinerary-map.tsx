"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { PlanMapPin } from "@/features/maps/google-export";

export type MapPin = PlanMapPin;

const DAY_COLORS = [
  "#0f766e",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#7c3aed",
  "#047857",
  "#c2410c",
  "#0369a1",
] as const;

function pinIconForDay(dayNumber?: number) {
  const color =
    dayNumber != null
      ? DAY_COLORS[(Math.max(1, dayNumber) - 1) % DAY_COLORS.length]
      : "#0f766e";
  const label = dayNumber != null ? String(dayNumber) : "•";
  return L.divIcon({
    className: "roavo-map-pin",
    html: `<div style="
      background:${color};
      color:#fff;
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font:600 12px/1 system-ui,sans-serif;
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0]!.latitude, pins[0]!.longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(
      pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map, pins]);
  return null;
}

export function ItineraryMap({
  pins,
  className,
}: {
  pins: MapPin[];
  className?: string;
}) {
  const center = useMemo((): [number, number] => {
    if (pins[0]) return [pins[0].latitude, pins[0].longitude];
    return [41.0082, 28.9784];
  }, [pins]);

  if (pins.length === 0) {
    return (
      <div
        className={`bg-muted text-muted-foreground flex items-center justify-center rounded-xl border text-sm ${className ?? "h-80"}`}
      >
        Haritada gösterilecek konum bulunamadı.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${className ?? "h-80"}`}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: 320 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={pinIconForDay(pin.dayNumber)}
          >
            <Popup>
              <strong>{pin.name}</strong>
              {pin.dayNumber != null ? (
                <>
                  <br />
                  <span>Gün {pin.dayNumber}</span>
                </>
              ) : null}
              {pin.subtitle ? (
                <>
                  <br />
                  <span>{pin.subtitle}</span>
                </>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
