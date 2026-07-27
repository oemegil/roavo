"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import type {
  DestinationSearchResponseDto,
  DestinationSummaryDto,
} from "@/features/destinations/dto";
import { DestinationCard } from "@/features/destinations/components/destination-card";
import { destinationKeys } from "@/features/destinations/query-keys";
import {
  DESTINATION_BEST_FOR,
  DESTINATION_BEST_FOR_LABELS,
  DESTINATION_BUDGET_LABELS,
  DESTINATION_BUDGET_LEVELS,
  DESTINATION_CATEGORIES,
  DESTINATION_CATEGORY_LABELS,
} from "@/server/domain/destinations/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "İstek başarısız oldu.");
  }
  return payload as T;
}

export function DestinationsBrowseClient({
  initialFeatured,
}: {
  initialFeatured: DestinationSummaryDto[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const qFromUrl = searchParams.get("q") ?? "";
  const categoryFromUrl = searchParams.get("category") ?? "";
  const budgetFromUrl = searchParams.get("budgetLevel") ?? "";
  const bestForFromUrl = searchParams.get("bestFor") ?? "";

  const [draftQuery, setDraftQuery] = useState(qFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(qFromUrl);

  // Keep local draft in sync when browser navigation changes the URL.
  const urlSyncKey = `${qFromUrl}|${categoryFromUrl}|${budgetFromUrl}|${bestForFromUrl}`;
  const [lastUrlSyncKey, setLastUrlSyncKey] = useState(urlSyncKey);
  if (urlSyncKey !== lastUrlSyncKey) {
    setLastUrlSyncKey(urlSyncKey);
    setDraftQuery(qFromUrl);
    setDebouncedQuery(qFromUrl);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(draftQuery.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draftQuery]);

  const updateUrl = useCallback(
    (next: {
      q?: string;
      category?: string;
      budgetLevel?: string;
      bestFor?: string;
    }) => {
      const params = new URLSearchParams();
      const q = next.q ?? debouncedQuery;
      const category = next.category ?? categoryFromUrl;
      const budgetLevel = next.budgetLevel ?? budgetFromUrl;
      const bestFor = next.bestFor ?? bestForFromUrl;
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (budgetLevel) params.set("budgetLevel", budgetLevel);
      if (bestFor) params.set("bestFor", bestFor);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [
      bestForFromUrl,
      budgetFromUrl,
      categoryFromUrl,
      debouncedQuery,
      pathname,
      router,
    ],
  );

  useEffect(() => {
    if (debouncedQuery === qFromUrl) return;
    updateUrl({ q: debouncedQuery });
  }, [debouncedQuery, qFromUrl, updateUrl]);

  const filters = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      category: categoryFromUrl || undefined,
      budgetLevel: budgetFromUrl || undefined,
      bestFor: bestForFromUrl || undefined,
    }),
    [bestForFromUrl, budgetFromUrl, categoryFromUrl, debouncedQuery],
  );

  const hasActiveSearch = Boolean(
    filters.q || filters.category || filters.budgetLevel || filters.bestFor,
  );

  const searchQuery = useQuery({
    queryKey: destinationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category) params.set("category", filters.category);
      if (filters.budgetLevel) params.set("budgetLevel", filters.budgetLevel);
      if (filters.bestFor) params.set("bestFor", filters.bestFor);
      params.set("limit", "20");
      return fetchJson<DestinationSearchResponseDto>(
        `/api/v1/destinations?${params.toString()}`,
      );
    },
    enabled: hasActiveSearch,
    placeholderData: (previous) => previous,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("not found")) return false;
      return failureCount < 1;
    },
  });

  const featuredQuery = useQuery({
    queryKey: destinationKeys.featured,
    queryFn: async () => {
      const payload = await fetchJson<{ items: DestinationSummaryDto[] }>(
        "/api/v1/destinations/featured",
      );
      return payload.items;
    },
    initialData: initialFeatured,
  });

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-heading">Destinasyonlar</h1>
        <p className="text-muted-foreground text-body">
          Hazır rotaları keşfedin veya katalogda arama yapın.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination-search">Destinasyon ara</Label>
          <Input
            id="destination-search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Lizbon, Tokyo veya Kapadokya yazın"
            autoComplete="off"
            aria-describedby="destination-search-hint"
          />
          <p id="destination-search-hint" className="text-muted-foreground text-xs">
            Sonuçlar yazdıkça güncellenir. Metin araması için en az 2 karakter gerekir.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect
            id="category"
            label="Kategori"
            value={categoryFromUrl}
            onChange={(value) => updateUrl({ category: value })}
            options={DESTINATION_CATEGORIES.map((value) => ({
              value,
              label: DESTINATION_CATEGORY_LABELS[value],
            }))}
          />
          <FilterSelect
            id="budgetLevel"
            label="Bütçe seviyesi"
            value={budgetFromUrl}
            onChange={(value) => updateUrl({ budgetLevel: value })}
            options={DESTINATION_BUDGET_LEVELS.map((value) => ({
              value,
              label: DESTINATION_BUDGET_LABELS[value],
            }))}
          />
          <FilterSelect
            id="bestFor"
            label="Kimler için"
            value={bestForFromUrl}
            onChange={(value) => updateUrl({ bestFor: value })}
            options={DESTINATION_BEST_FOR.map((value) => ({
              value,
              label: DESTINATION_BEST_FOR_LABELS[value],
            }))}
          />
        </div>

        {hasActiveSearch ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraftQuery("");
              setDebouncedQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            Filtreleri temizle
          </Button>
        ) : null}
      </div>

      {hasActiveSearch ? (
        <div className="space-y-4" aria-live="polite">
          <h2 className="text-lg font-semibold">Arama sonuçları</h2>
          {searchQuery.isLoading ? <CardSkeletonGrid /> : null}
          {searchQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Arama kullanılamıyor</AlertTitle>
              <AlertDescription>
                {searchQuery.error instanceof Error
                  ? searchQuery.error.message
                  : "Lütfen tekrar deneyin."}
              </AlertDescription>
            </Alert>
          ) : null}
          {searchQuery.data && searchQuery.data.items.length === 0 ? (
            <Alert>
              <AlertTitle>Destinasyon bulunamadı</AlertTitle>
              <AlertDescription>
                Bu destinasyonu bulamadık. Gezi oluştururken veya düzenlerken manuel
                olarak girebilirsiniz.
              </AlertDescription>
            </Alert>
          ) : null}
          {searchQuery.data && searchQuery.data.items.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {searchQuery.data.items.map((destination) => (
                <li key={destination.id}>
                  <DestinationCard destination={destination} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Öne çıkan destinasyonlar</h2>
          {featuredQuery.data.length === 0 ? (
            <Alert>
              <AlertTitle>Katalog yakında</AlertTitle>
              <AlertDescription>
                Katalog hazır olduğunda destinasyonlar burada görünecek. Şehir arayın
                veya daha sonra tekrar bakın.
              </AlertDescription>
            </Alert>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {featuredQuery.data.map((destination) => (
                <li key={destination.id}>
                  <DestinationCard destination={destination} />
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground text-sm">
            Bir şehir arayın veya öne çıkan destinasyonlara göz atın.
          </p>
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Tümü</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CardSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Destinasyonlar yükleniyor">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-4">
          <Skeleton className="aspect-[16/10] w-full" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
