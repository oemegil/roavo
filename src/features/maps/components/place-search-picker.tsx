"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export type PlaceCandidate = {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  osmId: string;
};

export function PlaceSearchPicker({
  cityHint,
  disabled,
  selectedLabel,
  onSelect,
  onClear,
}: {
  cityHint?: string | null;
  disabled?: boolean;
  selectedLabel?: string | null;
  onSelect: (place: PlaceCandidate) => void;
  onClear?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(() => cityHint ?? "");
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: trimmedQuery,
            city: city.trim() || null,
            limit: 5,
          }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setError(payload?.error?.message ?? "Yer aranamadı.");
          setResults([]);
          return;
        }
        const places = (payload.places ?? []) as PlaceCandidate[];
        setResults(places);
        setError(
          places.length === 0 ? "Sonuç yok. Şehir ipucunu veya yazımı dene." : null,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Yer aranamadı.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [canSearch, trimmedQuery, city]);

  return (
    <div className="space-y-3">
      {selectedLabel ? (
        <div className="bg-muted/40 flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm">
          <p className="min-w-0">
            <span className="font-medium">Seçili yer: </span>
            <span className="text-muted-foreground">{selectedLabel}</span>
          </p>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              disabled={disabled}
              onClick={onClear}
            >
              Temizle
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="place-search-q">Yer ara</Label>
          <Input
            id="place-search-q"
            value={query}
            placeholder="örn. Shibuya Sky"
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) {
                setResults([]);
                setError(null);
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="place-search-city">Şehir ipucu</Label>
          <Input
            id="place-search-city"
            value={city}
            placeholder="örn. Tokyo"
            disabled={disabled}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>

      {searching ? <Skeleton className="h-16 w-full" /> : null}
      {error && !searching ? (
        <p className="text-muted-foreground text-xs">{error}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="border-border divide-y overflow-hidden rounded-lg border">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                disabled={disabled}
                className="hover:bg-muted/50 w-full px-3 py-2.5 text-left text-sm disabled:opacity-50"
                onClick={() => {
                  onSelect(place);
                  setQuery("");
                  setResults([]);
                  setError(null);
                }}
              >
                <span className="font-medium">{place.name}</span>
                <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
                  {place.displayName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
