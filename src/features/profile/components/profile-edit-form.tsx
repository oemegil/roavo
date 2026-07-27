"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  username: z.string().min(3).max(30),
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().optional(),
  homeCountryCode: z.string().max(2).optional(),
  homeCity: z.string().max(80).optional(),
  preferredCurrency: z.string().max(3).optional(),
  preferredLanguage: z.string().max(10).optional(),
  travelPace: z.enum(["relaxed", "balanced", "packed", ""]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileEditForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      username: "",
      displayName: "",
      bio: "",
      avatarUrl: "",
      homeCountryCode: "",
      homeCity: "",
      preferredCurrency: "USD",
      preferredLanguage: "en",
      travelPace: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/v1/me");
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (!cancelled) {
          setLoadError(payload?.error?.message ?? "Profil yüklenemedi.");
        }
        return;
      }
      const user = payload.user;
      if (!cancelled) {
        form.reset({
          username: user.username ?? "",
          displayName: user.displayName ?? "",
          bio: user.bio ?? "",
          avatarUrl: user.avatarUrl ?? "",
          homeCountryCode: user.homeCountryCode ?? "",
          homeCity: user.homeCity ?? "",
          preferredCurrency: user.preferredCurrency ?? "USD",
          preferredLanguage: user.preferredLanguage ?? "en",
          travelPace: user.travelPreferences?.travelPace ?? "",
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(false);

    const response = await fetch("/api/v1/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: values.username,
        displayName: values.displayName,
        bio: values.bio?.trim() ? values.bio : null,
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl : null,
        homeCountryCode: values.homeCountryCode?.trim()
          ? values.homeCountryCode
          : null,
        homeCity: values.homeCity?.trim() ? values.homeCity : null,
        preferredCurrency: values.preferredCurrency || undefined,
        preferredLanguage: values.preferredLanguage || undefined,
        travelPreferences: {
          travelPace: values.travelPace || undefined,
        },
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setFormError(payload?.error?.message ?? "Değişiklikler kaydedilemedi.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["current-user"] });
    setSuccess(true);
    router.refresh();
  });

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Profil kullanılamıyor</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {(
        [
          ["username", "Kullanıcı adı", "username"],
          ["displayName", "Görünen ad", "name"],
          ["bio", "Biyografi", "off"],
          ["avatarUrl", "Avatar URL", "url"],
          ["homeCity", "Yaşadığınız şehir", "address-level2"],
          ["homeCountryCode", "Ülke kodu (ISO)", "country"],
          ["preferredCurrency", "Para birimi", "off"],
          ["preferredLanguage", "Dil", "language"],
        ] as const
      ).map(([name, label, autoComplete]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            autoComplete={autoComplete}
            {...form.register(name)}
          />
          {form.formState.errors[name] ? (
            <p className="text-destructive text-sm" role="alert">
              {form.formState.errors[name]?.message as string}
            </p>
          ) : null}
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="travelPace">Seyahat temposu</Label>
        <select
          id="travelPace"
          className="border-input bg-background h-11 w-full rounded-lg border px-3 text-sm"
          {...form.register("travelPace")}
        >
          <option value="">Seçilmedi</option>
          <option value="relaxed">Rahat</option>
          <option value="balanced">Dengeli</option>
          <option value="packed">Yoğun</option>
        </select>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Kaydedilemedi</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>Kaydedildi</AlertTitle>
          <AlertDescription>Profiliniz güncellendi.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
      </Button>
    </form>
  );
}
