"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  DESTINATION_TYPES,
  SUPPORTED_CURRENCIES,
  TRAVEL_INTERESTS,
} from "@/server/domain/trips/constants";
import {
  DestinationSelector,
  type DestinationSelection,
} from "@/features/destinations/components/destination-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  title: z.string().trim().min(1).max(100),
  originName: z.string().trim().min(1).max(120),
  originCountryCode: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  travelerCount: z.coerce.number().int().min(1).max(20),
  totalBudgetMajor: z.coerce.number().nonnegative().optional(),
  currencyCode: z.enum(SUPPORTED_CURRENCIES),
  travelPace: z.enum(["RELAXED", "BALANCED", "FAST_PACED"]),
  destinationTypes: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  dietaryNotes: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = ["Temel", "Destinasyon", "Bütçe", "Tercihler", "Özet"] as const;

export function CreateTripWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<DestinationSelection>(null);
  const preselectedId = searchParams.get("destinationId");

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      title: "",
      originName: "",
      originCountryCode: "",
      startDate: "",
      endDate: "",
      travelerCount: 1,
      currencyCode: "TRY",
      travelPace: "BALANCED",
      destinationTypes: [],
      interests: [],
      dietaryNotes: "",
      accessibilityNotes: "",
      additionalNotes: "",
    },
  });

  const values = form.watch();
  const destinationLabel =
    destination?.mode === "catalog"
      ? destination.name
      : destination?.mode === "manual"
        ? destination.name
        : "TBD";
  const summary = useMemo(
    () =>
      `${values.title || "Başlıksız"} · ${values.originName || "Kalkış"} → ${destinationLabel}`,
    [destinationLabel, values.originName, values.title],
  );

  function toggleArrayValue(
    field: "destinationTypes" | "interests",
    value: string,
  ) {
    const current = form.getValues(field);
    form.setValue(
      field,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function onSubmit(data: FormValues) {
    setError(null);
    const body: Record<string, unknown> = {
      ...data,
      originCountryCode: data.originCountryCode || undefined,
      totalBudgetMajor: data.totalBudgetMajor || undefined,
      dietaryNotes: data.dietaryNotes || undefined,
      accessibilityNotes: data.accessibilityNotes || undefined,
      additionalNotes: data.additionalNotes || undefined,
    };

    if (destination?.mode === "catalog") {
      body.destinationId = destination.destinationId;
    } else if (destination?.mode === "manual") {
      body.destinationName = destination.name;
      body.destinationCountryCode = destination.countryCode;
      body.destinationRegionName = destination.regionName;
    } else if (preselectedId) {
      body.destinationId = preselectedId;
    }

    const response = await fetch("/api/v1/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Gezi oluşturulamadı.");
      return;
    }
    router.push(`/trips/${payload.trip.id}`);
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Yeni trip</h1>
        <p className="text-muted-foreground text-body">
          Adım {step + 1} / {steps.length}: {steps[step]}
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {step === 0 ? (
          <>
            <Field label="Başlık" id="title">
              <Input id="title" {...form.register("title")} />
            </Field>
            <Field label="Kalkış" id="originName">
              <Input id="originName" {...form.register("originName")} />
            </Field>
            <Field label="Kalkış ülkesi (isteğe bağlı)" id="originCountryCode">
              <Input
                id="originCountryCode"
                maxLength={2}
                placeholder="TR"
                {...form.register("originCountryCode")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Başlangıç tarihi" id="startDate">
                <Input id="startDate" type="date" {...form.register("startDate")} />
              </Field>
              <Field label="Bitiş tarihi" id="endDate">
                <Input id="endDate" type="date" {...form.register("endDate")} />
              </Field>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <DestinationSelector value={destination} onChange={setDestination} />
        ) : null}

        {step === 2 ? (
          <>
            <Field label="Gezgin sayısı" id="travelerCount">
              <Input
                id="travelerCount"
                type="number"
                min={1}
                max={20}
                {...form.register("travelerCount")}
              />
            </Field>
            <Field label="Bütçe (isteğe bağlı)" id="totalBudgetMajor">
              <Input
                id="totalBudgetMajor"
                type="number"
                min={0}
                step="0.01"
                {...form.register("totalBudgetMajor")}
              />
            </Field>
            <Field label="Para birimi" id="currencyCode">
              <select
                id="currencyCode"
                className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
                {...form.register("currencyCode")}
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Field label="Tempo" id="travelPace">
              <select
                id="travelPace"
                className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
                {...form.register("travelPace")}
              >
                <option value="RELAXED">Rahat</option>
                <option value="BALANCED">Dengeli</option>
                <option value="FAST_PACED">Yoğun</option>
              </select>
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-label">Destinasyon türleri</legend>
              <div className="flex flex-wrap gap-2">
                {DESTINATION_TYPES.map((type) => (
                  <ToggleChip
                    key={type}
                    label={type.replaceAll("_", " ")}
                    active={values.destinationTypes.includes(type)}
                    onClick={() => toggleArrayValue("destinationTypes", type)}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-label">İlgi alanları</legend>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_INTERESTS.map((interest) => (
                  <ToggleChip
                    key={interest}
                    label={interest.replaceAll("_", " ")}
                    active={values.interests.includes(interest)}
                    onClick={() => toggleArrayValue("interests", interest)}
                  />
                ))}
              </div>
            </fieldset>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Alert>
              <AlertTitle>Özet</AlertTitle>
              <AlertDescription>{summary}</AlertDescription>
            </Alert>
            <Field label="Diyet notları" id="dietaryNotes">
              <Input id="dietaryNotes" {...form.register("dietaryNotes")} />
            </Field>
            <Field label="Erişilebilirlik notları" id="accessibilityNotes">
              <Input id="accessibilityNotes" {...form.register("accessibilityNotes")} />
            </Field>
            <Field label="Ek notlar" id="additionalNotes">
              <Input id="additionalNotes" {...form.register("additionalNotes")} />
            </Field>
          </>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Gezi oluşturulamadı</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Geri
            </Button>
          ) : null}
          {step < steps.length - 1 ? (
            <Button type="button" className="flex-1" onClick={() => setStep((s) => s + 1)}>
              Devam
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Oluşturuluyor…" : "Gezi oluştur"}
            </Button>
          )}
        </div>
      </form>
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

function ToggleChip({
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
      {label.toLowerCase()}
    </button>
  );
}
