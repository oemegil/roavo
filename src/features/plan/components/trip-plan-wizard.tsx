"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { FlightOptionDto } from "@/integrations/flights/types";
import { PLAN_CATEGORY_OPTIONS } from "@/features/plan/categories";
import { PlanLoadingMessages } from "@/features/plan/components/plan-loading-messages";
import { TurkishDateRangeField } from "@/features/plan/components/turkish-date-field";
import { ShowOnMapButton } from "@/features/maps/components/show-on-map-button";
import type { TravelInterest } from "@/server/domain/trips/constants";
import { ROAVO_BRAND } from "@/lib/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Region = { id: string; name: string; nameTr: string; countryCount: number };
type City = {
  id: string;
  name: string;
  nameTr: string;
  countryCode: string;
  iata: string | null;
  destinationSlug: string | null;
  regionId?: string;
  countryId?: string;
  hasAirport?: boolean;
};
type Origin = {
  id: string;
  name: string;
  nameTr: string;
  countryCode: string;
  iata: string;
};

type Mode = "tickets" | "plan" | "manual";

const TABS: Array<{ id: Mode; label: string; description: string }> = [
  {
    id: "plan",
    label: "Planla",
    description: "Şehir ve tercihlerini seç, AI ile günlük program oluştur.",
  },
  {
    id: "manual",
    label: "Gezi ekle",
    description:
      "Yaptığın bir gezinin kaydını tut; yerleri sonra haritaya ekleyebilirsin.",
  },
  {
    id: "tickets",
    label: "Bilet",
    description: "İsteğe bağlı: uçuş fiyatlarına bak, beğendiğini planlamaya taşı.",
  },
];

function parsePlanTab(value: string | null): Mode | null {
  if (value === "plan" || value === "manual" || value === "tickets") return value;
  return null;
}
function formatFlightClock(value: string | null) {
  if (!value) return null;
  const match = value.match(/T(\d{2}:\d{2})/) ?? value.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function formatFlightDuration(minutes: number | null) {
  if (minutes == null || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk`;
  if (rest === 0) return `${hours} sa`;
  return `${hours} sa ${rest} dk`;
}

function formatCarrierSummary(option: FlightOptionDto) {
  const outbound = option.outbound.carrier;
  const inbound = option.return.carrier;
  if (outbound && inbound && outbound !== inbound) {
    return `Gidiş: ${outbound} · Dönüş: ${inbound}`;
  }
  return outbound || inbound || null;
}

function formatLegLine(label: string, leg: FlightOptionDto["outbound"]) {
  const depart = formatFlightClock(leg.departureTime);
  const arrive = formatFlightClock(leg.arrivalTime);
  const duration = formatFlightDuration(leg.durationMinutes);
  const times = depart && arrive ? `${depart} → ${arrive}` : depart || arrive || null;
  const stops =
    leg.stops <= 0
      ? "Direkt"
      : leg.stopAirports.length > 0
        ? `${leg.stops} aktarma (${leg.stopAirports.join(", ")})`
        : `${leg.stops} aktarma`;
  return [label, times, duration, stops, leg.carrier].filter(Boolean).join(" · ");
}

export function TripPlanWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parsePlanTab(searchParams.get("tab")) ?? "plan";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDebug, setErrorDebug] = useState<string | null>(null);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [originQuery, setOriginQuery] = useState("");
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [catalogCities, setCatalogCities] = useState<City[]>([]);
  const [knownCities, setKnownCities] = useState<City[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [cityComboValue, setCityComboValue] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [planCitySuggestions, setPlanCitySuggestions] = useState<City[]>([]);
  const [planCitySearching, setPlanCitySearching] = useState(false);

  const [flightOptions, setFlightOptions] = useState<FlightOptionDto[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOptionDto | null>(null);
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const [flightSearching, setFlightSearching] = useState(false);
  const [interests, setInterests] = useState<TravelInterest[]>([]);
  const [planTitle, setPlanTitle] = useState("");
  const [planPreview, setPlanPreview] = useState<{
    titleSuggestion: string | null;
    summary: string;
    assumptions: string[];
    warnings: string[];
    days: Array<{
      dayNumber: number;
      date: string;
      theme: string | null;
      cityName?: string | null;
      scheduleText: string;
      eventsHighlight: string | null;
      notes: string | null;
      places?: Array<{ name: string; city?: string | null }>;
    }>;
  } | null>(null);
  const [previewMapPins, setPreviewMapPins] = useState<
    Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      subtitle?: string | null;
      dayNumber?: number;
      dayLabel?: string;
    }>
  >([]);
  const [selectedPreviewDay, setSelectedPreviewDay] = useState(0);

  // Manual trip
  const [manualTitle, setManualTitle] = useState("");
  const [manualDayNotes, setManualDayNotes] = useState<Record<string, string>>({});
  const [manualDayCityIds, setManualDayCityIds] = useState<Record<string, string[]>>({});
  const [manualSelectedDayIndex, setManualSelectedDayIndex] = useState(0);

  useEffect(() => {
    fetch("/api/v1/places/regions")
      .then((r) => r.json())
      .then((payload) => setRegions(payload.regions ?? []))
      .catch(() => null);
    fetch("/api/v1/places/cities?all=1")
      .then((r) => r.json())
      .then((payload) => setCatalogCities(payload.cities ?? []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!originQuery && !selectedOrigin) {
      fetch("/api/v1/places/origins")
        .then((r) => r.json())
        .then((payload) => setOrigins(payload.origins ?? []))
        .catch(() => null);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/v1/places/origins?q=${encodeURIComponent(originQuery)}`)
        .then((r) => r.json())
        .then((payload) => setOrigins(payload.origins ?? []))
        .catch(() => null);
    }, 200);
    return () => clearTimeout(timer);
  }, [originQuery, selectedOrigin]);

  const selectedCities = useMemo(() => {
    const directory = new Map<string, City>();
    for (const city of catalogCities) directory.set(city.id, city);
    for (const city of knownCities) directory.set(city.id, city);
    const uniqueIds = [...new Set(selectedCityIds)];
    return uniqueIds
      .map((id) => directory.get(id))
      .filter((city): city is City => Boolean(city));
  }, [selectedCityIds, catalogCities, knownCities]);

  const comboCities = useMemo(() => {
    if (mode === "tickets" && selectedRegion) {
      return catalogCities.filter((city) => city.regionId === selectedRegion.id);
    }
    return catalogCities;
  }, [catalogCities, mode, selectedRegion]);

  useEffect(() => {
    if (mode === "tickets") return;
    const q = cityQuery.trim();
    const timer = setTimeout(() => {
      setPlanCitySearching(true);
      fetch(`/api/v1/places/plan-cities?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((payload) => {
          const cities = (payload.cities ?? []).map(
            (city: {
              id: string;
              name: string;
              nameTr: string;
              countryCode: string;
              iata: string | null;
              hasAirport?: boolean;
            }) => ({
              id: city.id,
              name: city.name,
              nameTr: city.nameTr,
              countryCode: city.countryCode,
              iata: city.iata,
              destinationSlug: null,
              hasAirport: city.hasAirport,
            }),
          ) as City[];
          setPlanCitySuggestions(cities);
        })
        .catch(() => setPlanCitySuggestions([]))
        .finally(() => setPlanCitySearching(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [cityQuery, mode]);

  const dayCount = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }, [startDate, endDate]);

  const manualDayList = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return [] as string[];
    const days: string[] = [];
    const cursor = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    while (cursor <= end) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  function dayCityLabel(date: string) {
    const ids = (manualDayCityIds[date] ?? []).filter((id) =>
      selectedCityIds.includes(id),
    );
    return ids
      .map((id) => selectedCities.find((city) => city.id === id)?.nameTr)
      .filter(Boolean)
      .join("-");
  }

  const safeManualDayIndex = Math.min(
    manualSelectedDayIndex,
    Math.max(0, manualDayList.length - 1),
  );

  function resetModeForm() {
    setStartDate("");
    setEndDate("");
    setOriginQuery("");
    setSelectedOrigin(null);
    setSelectedRegion(null);
    setSelectedCityIds([]);
    setCityComboValue("");
    setCityQuery("");
    setPlanCitySuggestions([]);
    setKnownCities([]);
    setFlightOptions([]);
    setSelectedFlight(null);
    setShowFlightPicker(false);
    setFlightSearching(false);
    setInterests([]);
    setPlanTitle("");
    setPlanPreview(null);
    setPreviewMapPins([]);
    setSelectedPreviewDay(0);
    setManualTitle("");
    setManualDayNotes({});
    setManualDayCityIds({});
    setManualSelectedDayIndex(0);
    setError(null);
    setErrorDebug(null);
    setCreatedTripId(null);
    setPending(false);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;

    const touchesManual = mode === "manual" || next === "manual";
    if (touchesManual) {
      resetModeForm();
    } else {
      setPlanPreview(null);
      setPreviewMapPins([]);
      setSelectedPreviewDay(0);
      setShowFlightPicker(false);
      resetFeedback();
    }

    const params = new URLSearchParams(searchParams.toString());
    if (next === "plan") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `/plan?${query}` : "/plan", { scroll: false });
  }

  function resetFeedback() {
    setError(null);
    setErrorDebug(null);
    setCreatedTripId(null);
  }

  function cityIdsFromFlight(flight: FlightOptionDto) {
    const iatas = new Set([flight.entryCity.iata, flight.exitCity.iata]);
    const matched = catalogCities
      .filter((city) => city.iata != null && iatas.has(city.iata))
      .map((city) => city.id);
    return [...new Set(matched)];
  }

  function continueToPlanWithFlight(flight: FlightOptionDto) {
    setSelectedFlight(flight);
    setShowFlightPicker(false);
    const matchedCityIds = cityIdsFromFlight(flight);
    if (matchedCityIds.length > 0) {
      setSelectedCityIds(matchedCityIds);
    }
    setPlanPreview(null);
    setPreviewMapPins([]);
    setSelectedPreviewDay(0);
    setCreatedTripId(null);
    setError(null);
    setErrorDebug(null);
    router.replace("/plan", { scroll: false });
    requestAnimationFrame(() => {
      document
        .getElementById("plan-preferences")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function addCity(city: City) {
    setKnownCities((prev) =>
      prev.some((item) => item.id === city.id) ? prev : [...prev, city],
    );
    setSelectedCityIds((prev) => {
      if (prev.includes(city.id) || prev.length >= 8) return prev;
      return [...prev, city.id];
    });
    setCityComboValue("");
    setCityQuery("");
  }

  function addCityById(cityId: string) {
    const city =
      catalogCities.find((c) => c.id === cityId) ??
      knownCities.find((c) => c.id === cityId) ??
      planCitySuggestions.find((c) => c.id === cityId);
    if (!city) return;
    addCity(city);
  }

  function removeCity(cityId: string) {
    setSelectedCityIds((prev) => prev.filter((id) => id !== cityId));
  }

  function toggleDayCity(date: string, cityId: string) {
    setManualDayCityIds((prev) => {
      const current = prev[date] ?? [];
      const next = current.includes(cityId)
        ? current.filter((id) => id !== cityId)
        : [...current, cityId];
      return { ...prev, [date]: next };
    });
  }

  function toggleInterest(interest: TravelInterest) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest],
    );
  }

  async function searchFlights() {
    if (!selectedOrigin) return;
    if (!startDate || !endDate || endDate < startDate) {
      setError("Geçerli bir tarih aralığı seç.");
      return;
    }
    const regionWide = Boolean(selectedRegion) && selectedCityIds.length === 0;
    if (!regionWide && selectedCityIds.length === 0) {
      setError("En az bir şehir seç veya bir bölge seçip popüler destinasyonları ara.");
      return;
    }

    setFlightSearching(true);
    resetFeedback();
    setFlightOptions([]);
    setSelectedFlight(null);

    const body = regionWide
      ? {
          originIata: selectedOrigin.iata,
          originName: selectedOrigin.nameTr,
          mode: "region" as const,
          regionId: selectedRegion!.id,
          startDate,
          endDate,
          adults: 1,
        }
      : {
          originIata: selectedOrigin.iata,
          originName: selectedOrigin.nameTr,
          mode: "cities" as const,
          cityIds: selectedCityIds,
          startDate,
          endDate,
          adults: 1,
        };

    const response = await fetch("/api/v1/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    setFlightSearching(false);
    if (!response.ok) {
      const message = payload?.error?.message ?? "Uçuş araması başarısız.";
      if (!message.includes("uçuş bulunamadı")) setError(message);
      return;
    }
    setFlightOptions(payload.options ?? []);
    setSelectedFlight(payload.best ?? null);
    if (mode === "plan") setShowFlightPicker(true);
  }

  function buildPlanPayload(withFlight: boolean) {
    return {
      startDate,
      endDate,
      title: planTitle.trim() || undefined,
      origin: selectedOrigin
        ? {
            name: selectedOrigin.nameTr,
            iata: selectedOrigin.iata,
            countryCode: selectedOrigin.countryCode,
          }
        : undefined,
      cityIds: selectedCityIds,
      interests,
      ...(withFlight && selectedFlight
        ? {
            flight: {
              entryCityName: selectedFlight.entryCity.name,
              exitCityName: selectedFlight.exitCity.name,
              outboundOrigin: selectedFlight.outbound.origin,
              outboundDest: selectedFlight.outbound.destination,
              returnOrigin: selectedFlight.return.origin,
              returnDest: selectedFlight.return.destination,
              outboundDate: selectedFlight.outbound.date,
              returnDate: selectedFlight.return.date,
              priceAmount: selectedFlight.priceAmount,
              priceCurrency: selectedFlight.priceCurrency,
              priceStatus: selectedFlight.priceStatus,
              ignavId: selectedFlight.ignavId ?? undefined,
              routeSummary: selectedFlight.routeSummary,
              carrierSummary: [
                selectedFlight.outbound.carrier,
                selectedFlight.return.carrier,
              ]
                .filter(Boolean)
                .join(" / "),
            },
          }
        : {}),
      travelerCount: 1,
      travelPace: "BALANCED" as const,
      currencyCode:
        selectedFlight?.priceCurrency === "TRY" || !selectedFlight
          ? "TRY"
          : selectedFlight.priceCurrency,
    };
  }

  async function previewAiPlan(withFlight: boolean) {
    if (selectedCityIds.length === 0) {
      setError("Plan için en az bir şehir seç.");
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError("Geçerli bir tarih aralığı seç.");
      return;
    }
    if (withFlight && !selectedFlight) {
      setError("Önce bir uçuş seç veya uçuşsuz plan oluştur.");
      return;
    }

    setPending(true);
    resetFeedback();
    setPlanPreview(null);
    setPreviewMapPins([]);

    const response = await fetch("/api/v1/plan/preview-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPlanPayload(withFlight)),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Plan önizlemesi üretilemedi.");
      if (payload?.error?.metadata?.debug || payload?.error?.details) {
        setErrorDebug(JSON.stringify(payload.error, null, 2));
      }
      return;
    }

    setPlanPreview(payload.itinerary);
    setPreviewMapPins(payload.mapPins ?? []);
    setSelectedPreviewDay(0);
  }

  async function saveAiPlan() {
    if (!planPreview) {
      setError("Önce plan önizlemesi oluştur.");
      return;
    }

    setPending(true);
    resetFeedback();

    const response = await fetch("/api/v1/plan/create-trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildPlanPayload(Boolean(selectedFlight)),
        generateItinerary: false,
        itinerary: planPreview,
        title: planTitle.trim() || planPreview.titleSuggestion || undefined,
      }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Gezi kaydedilemedi.");
      return;
    }

    const tripId = payload.trip?.id as string | undefined;
    setPlanPreview(null);
    setPreviewMapPins([]);
    router.push(tripId ? `/trips/${tripId}` : "/trips");
    router.refresh();
  }

  async function createManualTrip() {
    if (!manualTitle.trim()) {
      setError("Geziye bir isim ver.");
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError("Geçerli bir tarih aralığı seç.");
      return;
    }
    if (selectedCityIds.length === 0) {
      setError("En az bir şehir seç.");
      return;
    }

    setPending(true);
    resetFeedback();
    const response = await fetch("/api/v1/plan/create-manual-trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: manualTitle.trim(),
        startDate,
        endDate,
        cityIds: selectedCityIds,
        days: manualDayList.map((date, index) => {
          const label = dayCityLabel(date);
          return {
            date,
            title: label ? `Gün ${index + 1} · ${label}` : `Gün ${index + 1}`,
            notes: manualDayNotes[date]?.trim() || undefined,
          };
        }),
      }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Gezi kaydı oluşturulamadı.");
      return;
    }
    router.push(`/trips/${payload.trip.id}`);
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-heading">Planla</h1>
          <p className="font-display text-base font-semibold tracking-tight">
            {ROAVO_BRAND.signature}
          </p>
          <p className="text-muted-foreground text-sm">
            {ROAVO_BRAND.promise} {TABS.find((tab) => tab.id === mode)?.description}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Seyahat modu"
          className="bg-muted/70 grid grid-cols-3 gap-1 rounded-xl p-1"
        >
          {TABS.map((tab) => {
            const selected = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => switchMode(tab.id)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-sm font-medium transition-all sm:px-3",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <TurkishDateRangeField
        id="tripDateRange"
        label="Tarih aralığı"
        startDate={startDate}
        endDate={endDate}
        onChange={({ startDate: nextStart, endDate: nextEnd }) => {
          setStartDate(nextStart);
          setEndDate(nextEnd);
        }}
      />
      {dayCount > 0 ? (
        <p className="text-muted-foreground text-xs">{dayCount} gün</p>
      ) : null}

      {mode === "tickets" ? (
        <div className="space-y-2">
          <Label htmlFor="origin">Kalkış şehri</Label>
          <Input
            id="origin"
            value={selectedOrigin ? selectedOrigin.nameTr : originQuery}
            placeholder="Ankara, İstanbul…"
            onChange={(event) => {
              setSelectedOrigin(null);
              setOriginQuery(event.target.value);
            }}
          />
          {!selectedOrigin ? (
            <div className="flex flex-wrap gap-2">
              {origins.map((origin) => (
                <Button
                  key={origin.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedOrigin(origin);
                    setOriginQuery(origin.nameTr);
                  }}
                >
                  {origin.nameTr} ({origin.iata})
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "tickets" ? (
        <div className="space-y-3">
          <Label>Bölge</Label>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <Button
                key={region.id}
                type="button"
                size="sm"
                variant={selectedRegion?.id === region.id ? "default" : "outline"}
                onClick={() => setSelectedRegion(region)}
              >
                {region.nameTr}
              </Button>
            ))}
          </div>
          {selectedRegion ? (
            <p className="text-muted-foreground text-xs">
              {selectedRegion.id === "europe"
                ? "Avrupa seçiliyken şehir seçmezsen, kalkışından popüler Avrupa şehirlerine gidiş-dönüş fiyatları listelenir."
                : selectedRegion.id === "americas"
                  ? "Amerika seçiliyken şehir seçmezsen popüler ABD / Kanada / Brezilya şehirleri aranır."
                  : `${selectedRegion.nameTr} seçiliyken şehir seçmezsen popüler destinasyonlar aranır.`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={mode === "tickets" ? "cityCombo" : "citySearch"}>
          Şehir ekle
        </Label>
        {mode === "tickets" ? (
          <select
            id="cityCombo"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={cityComboValue}
            onChange={(event) => {
              if (event.target.value) addCityById(event.target.value);
            }}
          >
            <option value="">Havalimanı olan şehir seç…</option>
            {comboCities.map((city) => (
              <option
                key={city.id}
                value={city.id}
                disabled={selectedCityIds.includes(city.id)}
              >
                {city.nameTr} ({city.iata})
              </option>
            ))}
          </select>
        ) : (
          <>
            <Input
              id="citySearch"
              value={cityQuery}
              placeholder="Şehir ara: Brugge, Kyoto, Kapadokya…"
              onChange={(event) => setCityQuery(event.target.value)}
            />
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {planCitySuggestions.length === 0 && cityQuery.trim() ? (
                <p className="text-muted-foreground text-xs">
                  {planCitySearching ? "Aranıyor…" : "Sonuç yok — başka yazım dene."}
                </p>
              ) : null}
              {planCitySuggestions.map((city) => (
                <Button
                  key={city.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedCityIds.includes(city.id)}
                  onClick={() => addCity(city)}
                >
                  {city.nameTr}
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    {city.countryCode}
                    {city.iata ? ` · ${city.iata}` : ""}
                  </span>
                </Button>
              ))}
            </div>
          </>
        )}
        <p className="text-muted-foreground text-xs">
          {mode === "tickets"
            ? "Bilet aramasında yalnızca havalimanı olan şehirler listelenir."
            : "Gezi planında havalimanı olmayan şehirler de seçilebilir — yazarak ara."}
        </p>
        {selectedCities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city) => (
              <button
                key={city.id}
                type="button"
                className="border-border rounded-full border px-3 py-1 text-sm"
                onClick={() => removeCity(city.id)}
              >
                {city.nameTr} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {mode === "plan" ? (
        <>
          {selectedFlight ? (
            <div className="border-border bg-muted/30 space-y-2 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-caption tracking-[0.12em] uppercase">Seçili uçuş</p>
                  <p className="font-medium">{selectedFlight.routeSummary}</p>
                  {formatCarrierSummary(selectedFlight) ? (
                    <p className="text-sm">{formatCarrierSummary(selectedFlight)}</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    {selectedFlight.priceAmount.toLocaleString("tr-TR")}{" "}
                    {selectedFlight.priceCurrency}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFlightPicker((prev) => !prev)}
                >
                  {showFlightPicker ? "Kapat" : "Değiştir"}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatLegLine("Gidiş", selectedFlight.outbound)}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatLegLine("Dönüş", selectedFlight.return)}
              </p>
            </div>
          ) : null}

          <div id="plan-preferences" className="scroll-mt-24 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planTitle">Plan adı (isteğe bağlı)</Label>
              <Input
                id="planTitle"
                value={planTitle}
                placeholder="Örn. İspanya turu"
                onChange={(event) => setPlanTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ne tarz bir gezi istiyorsun?</Label>
              <p className="text-muted-foreground text-xs">
                İlgi alanlarını seç; plan buna göre şekillenir.
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAN_CATEGORY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={interests.includes(option.value) ? "default" : "outline"}
                    onClick={() => toggleInterest(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mode === "manual" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manualTitle">Gezi adı</Label>
            <Input
              id="manualTitle"
              value={manualTitle}
              placeholder="Örn. 2024 Madrid anıları"
              onChange={(event) => setManualTitle(event.target.value)}
            />
          </div>

          {manualDayList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Önce tarih aralığını seç; günler burada belirecek.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Gün seç</Label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {manualDayList.map((date, index) => {
                    const cityLabel = dayCityLabel(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setManualSelectedDayIndex(index)}
                        className={`rounded-lg border px-3 py-2 text-sm whitespace-nowrap ${
                          safeManualDayIndex === index
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border"
                        }`}
                      >
                        Gün {index + 1}
                        {cityLabel ? ` · ${cityLabel}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const date = manualDayList[safeManualDayIndex];
                if (!date) return null;
                const cityLabel = dayCityLabel(date);
                const dayCities = (manualDayCityIds[date] ?? []).filter((id) =>
                  selectedCityIds.includes(id),
                );
                return (
                  <div className="space-y-3">
                    <div>
                      <Label>
                        Gün {safeManualDayIndex + 1}
                        {cityLabel ? ` · ${cityLabel}` : ""} — {date}
                      </Label>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Bu gün için şehir(leri) sen seç. Geçiş gününde birden fazla
                        işaretleyebilirsin (ör. Madrid + Sevilla → Madrid-Sevilla).
                      </p>
                    </div>

                    {selectedCities.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Önce yukarıdan en az bir şehir ekle.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedCities.map((city) => {
                          const active = dayCities.includes(city.id);
                          return (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => toggleDayCity(date, city.id)}
                              className={`rounded-full border px-3 py-1.5 text-sm ${
                                active
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {city.nameTr}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <textarea
                      id={`day-${date}`}
                      className="border-input bg-background min-h-48 w-full rounded-md border px-3 py-3 text-sm leading-relaxed"
                      placeholder="O gün neler yaptın, nereye gittin, yemekler, notlar…"
                      value={manualDayNotes[date] ?? ""}
                      onChange={(event) =>
                        setManualDayNotes((prev) => ({
                          ...prev,
                          [date]: event.target.value,
                        }))
                      }
                    />
                    <p className="text-muted-foreground text-xs">
                      Yukarıdan diğer günlere geçip tek tek doldurabilirsin. Kayıt
                      yalnızca “Geziyi kaydet” ile yapılır.
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      ) : null}

      {mode === "tickets" ||
      (mode === "plan" && showFlightPicker && flightOptions.length > 0) ? (
        <div className="space-y-3">
          {flightSearching ? (
            <p className="text-muted-foreground text-sm">Uçuşlar aranıyor…</p>
          ) : null}
          {flightOptions.length > 0 && mode === "tickets" ? (
            <p className="text-muted-foreground text-sm">
              Bir uçuş seç, sonra bununla plan yap.
            </p>
          ) : null}
          {flightOptions.map((option) => {
            const isSelected =
              selectedFlight?.ignavId === option.ignavId &&
              selectedFlight?.routeSummary === option.routeSummary;
            const carrierSummary = formatCarrierSummary(option);
            return (
              <div
                key={`${option.routeSummary}-${option.priceAmount}-${option.ignavId}`}
                className={cn(
                  "border-border rounded-xl border p-4",
                  isSelected && "ring-foreground ring-2",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setSelectedFlight(option);
                    if (mode === "plan") setShowFlightPicker(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{option.routeSummary}</p>
                    <p className="shrink-0 text-sm font-semibold">
                      {option.priceAmount.toLocaleString("tr-TR")} {option.priceCurrency}
                    </p>
                  </div>
                  {carrierSummary ? (
                    <p className="mt-1 text-sm font-medium">{carrierSummary}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-xs">
                    {formatLegLine("Gidiş", option.outbound)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatLegLine("Dönüş", option.return)}
                  </p>
                  {option.requiresSelfTransfer ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Kendi aktarman gerekir (self-transfer)
                    </p>
                  ) : null}
                </button>
                {mode === "tickets" && isSelected ? (
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => continueToPlanWithFlight(option)}
                  >
                    Bu uçuşla plan yap
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <PlanLoadingMessages active={pending && mode === "plan" && !planPreview} />

      {mode === "plan" && planPreview ? (
        <div className="border-border space-y-4 rounded-2xl border p-4">
          <div className="space-y-1">
            <p className="text-caption tracking-[0.12em] uppercase">Önizleme</p>
            <h2 className="text-lg font-semibold">
              {planPreview.titleSuggestion || planTitle || "Gezi planı"}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {planPreview.summary}
            </p>
            {planPreview.warnings.length > 0 ? (
              <Alert>
                <AlertTitle>Not</AlertTitle>
                <AlertDescription>{planPreview.warnings.join(" · ")}</AlertDescription>
              </Alert>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Henüz kaydedilmedi. Beğenirsen “Planı kaydet” ile gezilerine ekle.
            </p>
            <ShowOnMapButton readyPins={previewMapPins} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {planPreview.days.map((day, index) => (
              <button
                key={`${day.date}-${day.dayNumber}`}
                type="button"
                onClick={() => setSelectedPreviewDay(index)}
                className={`rounded-lg border px-3 py-2 text-sm whitespace-nowrap ${
                  selectedPreviewDay === index
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                }`}
              >
                Gün {day.dayNumber}
              </button>
            ))}
          </div>

          {planPreview.days[selectedPreviewDay] ? (
            <div className="space-y-3">
              <div>
                <p className="font-medium">
                  Gün {planPreview.days[selectedPreviewDay]!.dayNumber}
                  {planPreview.days[selectedPreviewDay]!.theme
                    ? ` · ${planPreview.days[selectedPreviewDay]!.theme}`
                    : ""}
                  {planPreview.days[selectedPreviewDay]!.cityName
                    ? ` · ${planPreview.days[selectedPreviewDay]!.cityName}`
                    : ""}
                </p>
                <p className="text-muted-foreground text-xs">
                  {planPreview.days[selectedPreviewDay]!.date}
                </p>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {planPreview.days[selectedPreviewDay]!.scheduleText}
              </p>
              {planPreview.days[selectedPreviewDay]!.eventsHighlight ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                  <p className="font-medium">Etkinlik notu</p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {planPreview.days[selectedPreviewDay]!.eventsHighlight}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {createdTripId ? (
              <p className="mt-2">
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => {
                    router.push(`/trips/${createdTripId}`);
                    router.refresh();
                  }}
                >
                  Oluşturulan geziye git
                </button>
              </p>
            ) : null}
            {errorDebug ? (
              <details className="mt-3" open>
                <summary className="cursor-pointer text-xs font-medium">
                  AI debug (prompt / yanıt)
                </summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-black/10 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {errorDebug}
                </pre>
              </details>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {mode === "tickets" ? (
          <>
            <Button
              type="button"
              className="flex-1"
              disabled={
                !selectedOrigin ||
                !startDate ||
                !endDate ||
                flightSearching ||
                (!selectedRegion && selectedCityIds.length === 0)
              }
              onClick={() => void searchFlights()}
            >
              {flightSearching ? "Aranıyor…" : "Uçuş fiyatlarını getir"}
            </Button>
            {selectedFlight ? (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => continueToPlanWithFlight(selectedFlight)}
              >
                Bu uçuşla plan yap
              </Button>
            ) : null}
          </>
        ) : null}

        {mode === "plan" ? (
          <>
            {!planPreview ? (
              <Button
                type="button"
                className="flex-1"
                disabled={selectedCityIds.length === 0 || pending || !startDate}
                onClick={() => void previewAiPlan(Boolean(selectedFlight))}
              >
                {pending
                  ? "Plan hazırlanıyor…"
                  : selectedFlight
                    ? "Seçili uçuşla plan oluştur"
                    : "Plan oluştur"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setPlanPreview(null);
                    setPreviewMapPins([]);
                    resetFeedback();
                  }}
                >
                  Önizlemeyi sil
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => void saveAiPlan()}
                >
                  {pending ? "Kaydediliyor…" : "Planı kaydet"}
                </Button>
              </>
            )}
          </>
        ) : null}

        {mode === "manual" ? (
          <Button
            type="button"
            className="flex-1"
            disabled={pending || !manualTitle.trim() || selectedCityIds.length === 0}
            onClick={() => void createManualTrip()}
          >
            {pending ? "Kaydediliyor…" : "Geziyi kaydet"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
