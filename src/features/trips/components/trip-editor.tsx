"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ShowOnMapButton } from "@/features/maps/components/show-on-map-button";
import type { TripDetailDto } from "@/features/trips/dto";
import { formatTripStatus } from "@/lib/i18n/trip-labels";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TripEditor({ initialTrip }: { initialTrip: TripDetailDto }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [selectedDayId, setSelectedDayId] = useState(initialTrip.days[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const orderedDays = useMemo(
    () => [...trip.days].sort((a, b) => a.position - b.position),
    [trip.days],
  );

  const selectedDay = useMemo(
    () => orderedDays.find((day) => day.id === selectedDayId) ?? orderedDays[0],
    [orderedDays, selectedDayId],
  );

  const selectedDayNumber = useMemo(() => {
    if (!selectedDay) return 1;
    const index = orderedDays.findIndex((day) => day.id === selectedDay.id);
    return index >= 0 ? index + 1 : 1;
  }, [orderedDays, selectedDay]);

  const totalItems = useMemo(
    () => trip.days.reduce((sum, day) => sum + day.items.length, 0),
    [trip.days],
  );

  const mapPins = useMemo(
    () =>
      orderedDays.flatMap((day, dayIndex) =>
        day.items
          .filter(
            (item) =>
              item.latitude != null && item.longitude != null && item.type !== "NOTE",
          )
          .map((item) => ({
            id: item.id,
            name: item.title,
            latitude: item.latitude!,
            longitude: item.longitude!,
            subtitle: item.locationName,
            dayNumber: dayIndex + 1,
            dayLabel: `Gün ${dayIndex + 1}${day.title ? ` · ${day.title}` : ""}`,
          })),
      ),
    [orderedDays],
  );

  const readOnly = trip.status === "ARCHIVED";

  function savePlan() {
    router.push("/trips");
    router.refresh();
  }

  async function regeneratePlan() {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    const generateResponse = await fetch(
      `/api/v1/trips/${trip.id}/ai/generate-itinerary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const generatePayload = await generateResponse.json().catch(() => null);
    if (!generateResponse.ok) {
      setGenerating(false);
      setError(
        generatePayload?.error?.message ??
          "Günlük program üretilemedi. Biraz sonra tekrar dene.",
      );
      return;
    }

    const applyResponse = await fetch(
      `/api/v1/trips/${trip.id}/ai/itinerary-previews/${generatePayload.previewId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const applyPayload = await applyResponse.json().catch(() => null);
    setGenerating(false);
    if (!applyResponse.ok) {
      setError(applyPayload?.error?.message ?? "Günlük program uygulanamadı.");
      return;
    }
    if (applyPayload?.trip) {
      setTrip(applyPayload.trip);
      setSelectedDayId(applyPayload.trip.days?.[0]?.id ?? selectedDayId);
    }
    setSuccess("Günlük program hazır.");
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-caption tracking-[0.14em] uppercase">
          {formatTripStatus(trip.status)}
        </p>
        <h1 className="text-heading">{trip.title}</h1>
        <p className="text-muted-foreground text-body">
          {trip.originName && trip.originName !== "Belirtilmedi"
            ? `${trip.originName} → `
            : ""}
          {trip.destinationName ?? "Destinasyon belirlenmedi"} · {trip.startDate} –{" "}
          {trip.endDate}
        </p>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={savePlan} disabled={generating}>
              Gezilerime dön
            </Button>
            {totalItems === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void regeneratePlan()}
                disabled={generating}
              >
                {generating ? "Günlük programın hazırlanıyor…" : "Planı yeniden oluştur"}
              </Button>
            ) : null}
          </div>
        ) : null}
        <ShowOnMapButton readyPins={mapPins} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Güncelleme başarısız</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>Kaydedildi</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {readOnly ? (
        <Alert>
          <AlertTitle>Arşivlenmiş gezi</AlertTitle>
          <AlertDescription>Bu gezi yalnızca görüntülenebilir.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {orderedDays.map((day, index) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setSelectedDayId(day.id)}
            className={`rounded-lg border px-3 py-2 text-sm whitespace-nowrap ${
              selectedDay?.id === day.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            Gün {index + 1}
          </button>
        ))}
      </div>

      {selectedDay ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Gün {selectedDayNumber}
              {selectedDay.title ? ` · ${selectedDay.title}` : ""}
            </CardTitle>
            <CardDescription>{selectedDay.date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDay.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu gün için henüz program yok.
              </p>
            ) : null}

            <ul className="space-y-3">
              {selectedDay.items.map((item, index) => (
                <li
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.title.toLowerCase().includes("etkinlik")
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-2">
                    <p className="font-medium">{item.title}</p>
                    {item.locationName ? (
                      <p className="text-muted-foreground text-sm">{item.locationName}</p>
                    ) : null}
                    {item.description ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    ) : null}
                    {selectedDay.notes && index === 0 ? (
                      <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                        {selectedDay.notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
