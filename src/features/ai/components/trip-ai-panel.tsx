"use client";

import { useState } from "react";

import type { TripDetailDto } from "@/features/trips/dto";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function TripAiPanel({
  trip,
  selectedDayId,
  onTripUpdated,
}: {
  trip: TripDetailDto;
  selectedDayId?: string;
  onTripUpdated: (trip: TripDetailDto) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [preserveManual, setPreserveManual] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    previewId: string;
    summary: string;
    operations: unknown[];
    warnings: string[];
  } | null>(null);

  async function propose(path: string, body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "AI isteği başarısız.");
      return;
    }
    setPreview({
      previewId: payload.previewId,
      summary: payload.summary,
      operations: payload.operations ?? [],
      warnings: payload.warnings ?? [],
    });
  }

  async function applyPreview() {
    if (!preview) return;
    setPending(true);
    setError(null);
    const response = await fetch(
      `/api/v1/trips/${trip.id}/ai/edit-previews/${preview.previewId}/apply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "AI değişiklikleri uygulanamadı.");
      return;
    }
    onTripUpdated(payload.trip);
    setPreview(null);
    setInstruction("");
  }

  async function discardPreview() {
    if (!preview) return;
    await fetch(`/api/v1/trips/${trip.id}/ai/edit-previews/${preview.previewId}`, {
      method: "DELETE",
    });
    setPreview(null);
  }

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <h2 className="font-semibold">AI ile iyileştir</h2>
        <p className="text-muted-foreground text-xs">
          Değişiklikler önce önerilir. Manuel öğeler varsayılan olarak korunur.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-instruction">Talimat</Label>
        <textarea
          id="ai-instruction"
          className="border-input bg-background min-h-24 w-full rounded-lg border px-3 py-2 text-sm"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          maxLength={1000}
          placeholder="2. günü daha rahat yap ve müzeleri çıkar."
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={preserveManual}
          onChange={(e) => setPreserveManual(e.target.checked)}
        />
        Manuel eklenen öğeleri koru
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || instruction.trim().length < 3}
          onClick={() =>
            propose(`/api/v1/trips/${trip.id}/ai/edit`, {
              instruction,
              preserveManualItems: preserveManual,
              expectedTripVersion: trip.updatedAt,
              scope: { type: "trip" },
            })
          }
        >
          Düzenleme öner
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !selectedDayId}
          onClick={() =>
            selectedDayId &&
            propose(`/api/v1/trips/${trip.id}/days/${selectedDayId}/ai/regenerate`, {
              instruction: instruction || undefined,
              preserveManualItems: preserveManual,
              expectedTripVersion: trip.updatedAt,
            })
          }
        >
          Günü yeniden üret
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            propose(`/api/v1/trips/${trip.id}/ai/edit`, {
              instruction: "Genel planı daha rahat yap, daha az aktivite olsun.",
              preserveManualItems: preserveManual,
              expectedTripVersion: trip.updatedAt,
              scope: { type: "trip" },
            })
          }
        >
          Daha rahat yap
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            propose(`/api/v1/trips/${trip.id}/ai/edit`, {
              instruction: "Ücretli cazibe merkezlerini azalt; ücretsiz veya düşük maliyetli aktivitelere öncelik ver.",
              preserveManualItems: preserveManual,
              expectedTripVersion: trip.updatedAt,
              scope: { type: "trip" },
            })
          }
        >
          Bütçeyi düşür
        </Button>
      </div>

      {preview ? (
        <Alert>
          <AlertTitle>Önerilen değişiklikler</AlertTitle>
          <AlertDescription>
            <p>{preview.summary}</p>
            <p className="mt-2 text-xs">
              {preview.operations.length} işlem
              {preview.warnings.length
                ? ` · Uyarılar: ${preview.warnings.join("; ")}`
                : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" disabled={pending} onClick={applyPreview}>
                Uygula
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={discardPreview}
              >
                Vazgeç
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>AI düzenleme sorunu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
