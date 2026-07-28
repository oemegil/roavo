"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string | null;
};

const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
        className={`bg-muted text-muted-foreground flex items-center justify-center rounded-xl border text-sm ${className ?? "h-72"}`}
      >
        Haritada gösterilecek konum bulunamadı.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${className ?? "h-72"}`}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: 280 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={pinIcon}>
            <Popup>
              <strong>{pin.name}</strong>
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
