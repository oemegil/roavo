"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DESTINATION_TYPES,
  SUPPORTED_CURRENCIES,
  TRAVEL_INTERESTS,
} from "@/server/domain/trips/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Recommendation = {
  rank: number;
  destinationMode: "CATALOG" | "MANUAL";
  destinationId: string | null;
  name: string;
  countryCode: string;
  reason: string;
  matchingInterests: string[];
  budgetFit: string;
  durationFit: string;
  potentialTradeoffs: string[];
  suggestedTripTitle: string;
  confidence: string;
};

const steps = ["Temel", "Tercihler", "Notlar", "Sonuçlar"] as const;

export function AiPlanWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationId, setOperationId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [originName, setOriginName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelerCount, setTravelerCount] = useState(1);
  const [totalBudgetMajor, setTotalBudgetMajor] = useState<number | "">("");
  const [currencyCode, setCurrencyCode] = useState<(typeof SUPPORTED_CURRENCIES)[number]>("TRY");
  const [travelPace, setTravelPace] = useState<"RELAXED" | "BALANCED" | "FAST_PACED">(
    "BALANCED",
  );
  const [companion, setCompanion] = useState<"SOLO" | "COUPLE" | "FAMILY" | "FRIENDS">(
    "SOLO",
  );
  const [climate, setClimate] = useState<"ANY" | "WARM" | "MILD" | "COLD">("ANY");
  const [interests, setInterests] = useState<string[]>([]);
  const [destinationTypes, setDestinationTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const canContinueBasics = originName.trim() && startDate && endDate;

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function generate() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/v1/ai/destination-recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originName,
        startDate,
        endDate,
        travelerCount,
        totalBudgetMajor: totalBudgetMajor === "" ? undefined : Number(totalBudgetMajor),
        currencyCode,
        travelPace,
        travelCompanionType: companion,
        climatePreference: climate,
        interests,
        destinationTypes,
        additionalPreferences: notes || undefined,
      }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Öneri alınamadı.");
      return;
    }
    setOperationId(payload.operationId);
    setSummary(payload.summary);
    setRecommendations(payload.recommendations ?? []);
    setStep(3);
  }

  async function selectRank(rank: number) {
    if (!operationId) return;
    setPending(true);
    setError(null);
    const response = await fetch(
      `/api/v1/ai/destination-recommendations/${operationId}/select`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationRank: rank }),
      },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Gezi oluşturulamadı.");
      return;
    }
    router.push(`/trips/${payload.trip.id}/generate`);
    router.refresh();
  }

  const progressLabel = useMemo(() => {
    if (pending && step < 3) return "Destinasyonlar karşılaştırılıyor…";
    if (pending) return "Gezi oluşturuluyor…";
    return null;
  }, [pending, step]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">AI ile planla</h1>
        <p className="text-muted-foreground text-body">
          Adım {step + 1} / {steps.length}: {steps[step]}
        </p>
        <p className="text-muted-foreground text-xs">
          Öneriler AI tarafından üretilir; hatalar içerebilir.
        </p>
      </div>

      {progressLabel ? (
        <Alert>
          <AlertTitle>Çalışıyor</AlertTitle>
          <AlertDescription aria-live="polite">{progressLabel}</AlertDescription>
        </Alert>
      ) : null}

      {step === 0 ? (
        <div className="space-y-4">
          <Field label="Nereden" id="originName">
            <Input
              id="originName"
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Başlangıç tarihi" id="startDate">
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Bitiş tarihi" id="endDate">
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Gezgin sayısı" id="travelerCount">
            <Input
              id="travelerCount"
              type="number"
              min={1}
              max={20}
              value={travelerCount}
              onChange={(e) => setTravelerCount(Number(e.target.value))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bütçe (isteğe bağlı)" id="budget">
              <Input
                id="budget"
                type="number"
                min={0}
                value={totalBudgetMajor}
                onChange={(e) =>
                  setTotalBudgetMajor(e.target.value ? Number(e.target.value) : "")
                }
              />
            </Field>
            <Field label="Para birimi" id="currency">
              <select
                id="currency"
                className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
                value={currencyCode}
                onChange={(e) =>
                  setCurrencyCode(e.target.value as (typeof SUPPORTED_CURRENCIES)[number])
                }
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Tempo" id="pace">
            <select
              id="pace"
              className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
              value={travelPace}
              onChange={(e) =>
                setTravelPace(e.target.value as typeof travelPace)
              }
            >
              <option value="RELAXED">Rahat</option>
              <option value="BALANCED">Dengeli</option>
              <option value="FAST_PACED">Yoğun</option>
            </select>
          </Field>
          <Field label="Kimlerle" id="companion">
            <select
              id="companion"
              className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
              value={companion}
              onChange={(e) => setCompanion(e.target.value as typeof companion)}
            >
              <option value="SOLO">Tek</option>
              <option value="COUPLE">Çift</option>
              <option value="FAMILY">Aile</option>
              <option value="FRIENDS">Arkadaşlar</option>
            </select>
          </Field>
          <Field label="İklim tercihi" id="climate">
            <select
              id="climate"
              className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
              value={climate}
              onChange={(e) => setClimate(e.target.value as typeof climate)}
            >
              <option value="ANY">Fark etmez</option>
              <option value="WARM">Sıcak</option>
              <option value="MILD">Ilıman</option>
              <option value="COLD">Soğuk</option>
            </select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-label">İlgi alanları</legend>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_INTERESTS.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  active={interests.includes(interest)}
                  onClick={() => toggle(interests, interest, setInterests)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-label">Destinasyon tarzı</legend>
            <div className="flex flex-wrap gap-2">
              {DESTINATION_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  active={destinationTypes.includes(type)}
                  onClick={() =>
                    toggle(destinationTypes, type, setDestinationTypes)
                  }
                />
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <Field label="Başka bilmemiz gereken bir şey var mı?" id="notes">
            <textarea
              id="notes"
              className="border-input bg-background min-h-28 w-full rounded-lg border px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          </Field>
          <Alert>
            <AlertTitle>Öneri öncesi</AlertTitle>
            <AlertDescription>
              Roavo, tercihlerine göre katalog destinasyonlarını sıralar. Canlı fiyat,
              harita veya vize kararı içermez.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          {summary ? <p className="text-body">{summary}</p> : null}
          <ul className="space-y-4">
            {recommendations.map((item) => (
              <li key={item.rank} className="border-border space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      #{item.rank} {item.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {item.countryCode} · {item.confidence.toLowerCase()} uyum ·{" "}
                      {item.destinationMode === "CATALOG" ? "Katalog" : "Manuel öneri"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() => selectRank(item.rank)}
                  >
                    Seç
                  </Button>
                </div>
                <p className="text-sm">{item.reason}</p>
                <p className="text-muted-foreground text-xs">
                  Bütçe: {item.budgetFit.toLowerCase()} · Süre:{" "}
                  {item.durationFit.toLowerCase()}
                </p>
                {item.potentialTradeoffs.length ? (
                  <p className="text-muted-foreground text-xs">
                    Dikkat: {item.potentialTradeoffs.join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Bir şeyler ters gitti</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-3">
        {step > 0 && step < 3 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            Geri
          </Button>
        ) : null}
        {step < 2 ? (
          <Button
            type="button"
            className="flex-1"
            disabled={step === 0 && !canContinueBasics}
            onClick={() => setStep((s) => s + 1)}
          >
            Devam
          </Button>
        ) : null}
        {step === 2 ? (
          <Button type="button" className="flex-1" disabled={pending} onClick={generate}>
            {pending ? "Oluşturuluyor…" : "Öneri al"}
          </Button>
        ) : null}
        {step === 3 ? (
          <Button type="button" variant="outline" onClick={() => setStep(2)}>
            Tercihleri düzenle
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border"
      }`}
    >
      {label.replaceAll("_", " ").toLowerCase()}
    </button>
  );
}
