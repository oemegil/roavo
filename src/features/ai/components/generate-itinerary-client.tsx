"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { TripDetailDto } from "@/features/trips/dto";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PreviewPayload = {
  previewId: string;
  itinerary: {
    summary: string;
    assumptions: string[];
    warnings: string[];
    days: Array<{
      dayNumber: number;
      date: string;
      theme: string | null;
      items: Array<{ title: string; type: string; startTime: string | null }>;
    }>;
  };
  warnings: string[];
};

export function GenerateItineraryClient({ trip }: { trip: TripDetailDto }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/v1/trips/${trip.id}/ai/generate-itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Plan oluşturulamadı.");
      return;
    }
    setPreview(payload);
  }

  async function apply() {
    if (!preview) return;
    setPending(true);
    setError(null);
    const response = await fetch(
      `/api/v1/trips/${trip.id}/ai/itinerary-previews/${preview.previewId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Plan trip'e uygulanamadı.");
      return;
    }
    router.push(`/trips/${trip.id}`);
    router.refresh();
  }

  async function discard() {
    if (!preview) return;
    await fetch(
      `/api/v1/trips/${trip.id}/ai/itinerary-previews/${preview.previewId}`,
      { method: "DELETE" },
    );
    setPreview(null);
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Günlük plan oluştur</h1>
        <p className="text-muted-foreground text-body">
          {trip.title} · {trip.destinationName ?? "Destinasyon yok"}
        </p>
        <p className="text-muted-foreground text-xs">
          AI planları öneridir. Seyahat öncesi detayları doğrula.
        </p>
      </div>

      {!preview ? (
        <Button type="button" disabled={pending || !trip.destinationName} onClick={generate}>
          {pending ? "Planın hazırlanıyor…" : "Zamanlı plan önizlemesi oluştur"}
        </Button>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Önizleme hazır</AlertTitle>
            <AlertDescription>{preview.itinerary.summary}</AlertDescription>
          </Alert>
          <ul className="space-y-3">
            {preview.itinerary.days.map((day) => (
              <li key={day.dayNumber} className="border-border rounded-xl border p-4">
                <h2 className="font-semibold">
                  Gün {day.dayNumber} · {day.date}
                  {day.theme ? ` · ${day.theme}` : ""}
                </h2>
                <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                  {day.items.map((item) => (
                    <li key={`${day.dayNumber}-${item.title}`}>
                      {item.startTime ? `${item.startTime} · ` : ""}
                      {item.title} ({item.type.toLowerCase()})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={pending} onClick={apply}>
              {pending ? "Kaydediliyor…" : "Geziye uygula"}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={discard}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Oluşturma sorunu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
