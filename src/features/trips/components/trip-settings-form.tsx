"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { TripDetailDto } from "@/features/trips/dto";
import {
  DestinationSelector,
  type DestinationSelection,
} from "@/features/destinations/components/destination-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function toSelection(trip: TripDetailDto): DestinationSelection {
  if (trip.destinationId && trip.destinationName) {
    return {
      mode: "catalog",
      destinationId: trip.destinationId,
      name: trip.destinationName,
      countryCode: trip.destinationCountryCode,
      regionName: trip.destinationRegionName,
    };
  }
  if (trip.destinationName) {
    return {
      mode: "manual",
      name: trip.destinationName,
      countryCode: trip.destinationCountryCode ?? undefined,
      regionName: trip.destinationRegionName ?? undefined,
    };
  }
  return null;
}

export function TripSettingsForm({ trip }: { trip: TripDetailDto }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState<DestinationSelection>(() =>
    toSelection(trip),
  );
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">(
    trip.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const itemCount = trip.days.reduce((sum, day) => sum + day.items.length, 0);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const detailsResponse = await fetch(`/api/v1/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startDate,
        endDate,
        expectedUpdatedAt: trip.updatedAt,
      }),
    });
    const detailsPayload = await detailsResponse.json().catch(() => null);
    if (!detailsResponse.ok) {
      setPending(false);
      setError(detailsPayload?.error?.message ?? "Gezi detayları kaydedilemedi.");
      return;
    }

    if (visibility !== (trip.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE")) {
      const visibilityResponse = await fetch(`/api/v1/trips/${trip.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const visibilityPayload = await visibilityResponse.json().catch(() => null);
      if (!visibilityResponse.ok) {
        setPending(false);
        setError(visibilityPayload?.error?.message ?? "Görünürlük güncellenemedi.");
        return;
      }
    }

    const current = toSelection(trip);
    const destinationChanged = JSON.stringify(current) !== JSON.stringify(destination);

    if (destinationChanged) {
      if (!destination) {
        const clearResponse = await fetch(`/api/v1/trips/${trip.id}/destination`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmItineraryWarning: itemCount > 0 ? true : undefined,
          }),
        });
        const clearPayload = await clearResponse.json().catch(() => null);
        if (!clearResponse.ok) {
          setPending(false);
          setError(clearPayload?.error?.message ?? "Destinasyon temizlenemedi.");
          return;
        }
      } else {
        const body =
          destination.mode === "catalog"
            ? {
                mode: "catalog" as const,
                destinationId: destination.destinationId,
                confirmItineraryWarning: itemCount > 0 ? true : undefined,
              }
            : {
                mode: "manual" as const,
                name: destination.name,
                countryCode: destination.countryCode,
                regionName: destination.regionName,
                confirmItineraryWarning: itemCount > 0 ? true : undefined,
              };

        const destResponse = await fetch(`/api/v1/trips/${trip.id}/destination`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const destPayload = await destResponse.json().catch(() => null);
        if (!destResponse.ok) {
          setPending(false);
          setError(destPayload?.error?.message ?? "Destinasyon güncellenemedi.");
          return;
        }
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    setPending(false);
    router.push(`/trips/${trip.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <DestinationSelector
        value={destination}
        onChange={setDestination}
        itemCount={itemCount}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Başlangıç tarihi</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Bitiş tarihi</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="visibility">Keşfet’te paylaş</Label>
            <p className="text-muted-foreground text-sm">
              {visibility === "PUBLIC"
                ? "Herkese açık — uçuş bilgisi paylaşılmaz."
                : "Özel — sadece sen görürsün."}
            </p>
          </div>
          <Switch
            id="visibility"
            checked={visibility === "PUBLIC"}
            disabled={trip.status === "ARCHIVED"}
            onCheckedChange={(checked) => setVisibility(checked ? "PUBLIC" : "PRIVATE")}
          />
        </div>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Kaydedilemedi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending || trip.status === "ARCHIVED"}>
        {pending ? "Kaydediliyor…" : "Detayları kaydet"}
      </Button>
    </form>
  );
}
