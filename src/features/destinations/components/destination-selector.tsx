"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { DestinationSearchResponseDto } from "@/features/destinations/dto";
import { destinationKeys } from "@/features/destinations/query-keys";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export type DestinationSelection =
  | {
      mode: "catalog";
      destinationId: string;
      name: string;
      countryCode: string | null;
      regionName: string | null;
    }
  | {
      mode: "manual";
      name: string;
      countryCode?: string;
      regionName?: string;
    }
  | null;

export function DestinationSelector({
  value,
  onChange,
  itemCount = 0,
}: {
  value: DestinationSelection;
  onChange: (value: DestinationSelection) => void;
  itemCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCountry, setManualCountry] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSelection, setPendingSelection] =
    useState<DestinationSelection>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: destinationKeys.list({ q: debounced || undefined }),
    queryFn: async () => {
      const params = new URLSearchParams({ q: debounced, limit: "8" });
      const response = await fetch(`/api/v1/destinations?${params}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Arama başarısız oldu.");
      }
      return payload as DestinationSearchResponseDto;
    },
    enabled: debounced.length >= 2,
    placeholderData: (previous) => previous,
  });

  function applySelection(next: DestinationSelection) {
    if (itemCount > 0) {
      setPendingSelection(next);
      setConfirmOpen(true);
      return;
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trip-destination-search">Destinasyon bul</Label>
        <Input
          id="trip-destination-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Katalogda ara"
          autoComplete="off"
        />
      </div>

      {value ? (
        <Alert>
          <AlertTitle>Seçilen destinasyon</AlertTitle>
          <AlertDescription>
            {value.mode === "catalog"
              ? `${value.name}${value.countryCode ? ` (${value.countryCode})` : ""} · katalog`
              : `${value.name} · manuel girildi`}
          </AlertDescription>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => applySelection(null)}
          >
            Destinasyonu temizle
          </Button>
        </Alert>
      ) : null}

      {debounced.length >= 2 ? (
        <div className="space-y-2" aria-live="polite">
          {searchQuery.isLoading ? <Skeleton className="h-20 w-full" /> : null}
          {searchQuery.data?.items.map((destination) => (
            <button
              key={destination.id}
              type="button"
              className="border-border hover:bg-muted w-full rounded-lg border px-3 py-3 text-left"
              onClick={() =>
                applySelection({
                  mode: "catalog",
                  destinationId: destination.id,
                  name: destination.name,
                  countryCode: destination.countryCode,
                  regionName: destination.regionName,
                })
              }
            >
              <span className="font-medium">{destination.name}</span>
              <span className="text-muted-foreground block text-xs">
                {destination.countryName}
              </span>
            </button>
          ))}
          {searchQuery.data && searchQuery.data.items.length === 0 ? (
            <Alert>
              <AlertTitle>Katalogda eşleşme yok</AlertTitle>
              <AlertDescription>
                Bu destinasyonu bulamadık. Manuel olarak girip planlamaya devam
                edebilirsiniz.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setManualOpen((open) => !open)}
        >
          {manualOpen ? "Manuel girişi gizle" : "Destinasyonu manuel gir"}
        </Button>
        {manualOpen ? (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="space-y-2">
              <Label htmlFor="manual-destination-name">Destinasyon adı</Label>
              <Input
                id="manual-destination-name"
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manual-country">Ülke kodu (isteğe bağlı)</Label>
                <Input
                  id="manual-country"
                  maxLength={2}
                  value={manualCountry}
                  onChange={(event) => setManualCountry(event.target.value)}
                  placeholder="PT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-region">Bölge (isteğe bağlı)</Label>
                <Input
                  id="manual-region"
                  value={manualRegion}
                  onChange={(event) => setManualRegion(event.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              disabled={!manualName.trim()}
              onClick={() =>
                applySelection({
                  mode: "manual",
                  name: manualName.trim(),
                  countryCode: manualCountry.trim() || undefined,
                  regionName: manualRegion.trim() || undefined,
                })
              }
            >
              Manuel destinasyonu kullan
            </Button>
          </div>
        ) : null}
      </div>

      {confirmOpen ? (
        <Alert variant="destructive">
          <AlertTitle>Destinasyon değiştirilsin mi?</AlertTitle>
          <AlertDescription>
            Destinasyonu değiştirmek mevcut program öğelerini güncellemez veya
            silmez.
          </AlertDescription>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              onClick={() => {
                onChange(pendingSelection);
                setConfirmOpen(false);
                setPendingSelection(null);
              }}
            >
              Değişikliği onayla
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setPendingSelection(null);
              }}
            >
              İptal
            </Button>
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
