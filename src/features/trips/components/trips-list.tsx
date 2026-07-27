"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TripSummaryDto } from "@/features/trips/dto";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function TripsListClient({ initialStatus }: { initialStatus: "DRAFT" | "ARCHIVED" }) {
  const [status, setStatus] = useState<"DRAFT" | "ARCHIVED">(initialStatus);
  const [trips, setTrips] = useState<TripSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/v1/trips?status=${status}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (!cancelled) {
          setError(payload?.error?.message ?? "Geziler yüklenemedi.");
          setLoading(false);
        }
        return;
      }
      if (!cancelled) {
        setTrips(payload.trips ?? []);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-heading">Gezilerin</h1>
          <p className="text-muted-foreground text-body">
            Özel planla, istediğin zaman düzenle, sonra paylaş.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/plan">Yeni gezi</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={status === "DRAFT" ? "default" : "outline"}
          onClick={() => setStatus("DRAFT")}
        >
          Aktif
        </Button>
        <Button
          type="button"
          variant={status === "ARCHIVED" ? "default" : "outline"}
          onClick={() => setStatus("ARCHIVED")}
        >
          Arşiv
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Geziler yüklenemedi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && trips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {status === "DRAFT" ? "Henüz gezi yok" : "Arşivlenmiş gezi yok"}
            </CardTitle>
            <CardDescription>
              {status === "DRAFT"
                ? "İlk gezini oluştur ve gün gün planını kur."
                : "Arşivlenen geziler burada görünür."}
            </CardDescription>
          </CardHeader>
          {status === "DRAFT" ? (
            <CardContent>
              <Button asChild>
                <Link href="/plan">İlk gezini oluştur</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
            <Card className="hover:border-primary/40 h-full transition-colors">
              <CardHeader>
                <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
                <CardDescription>
                  {trip.destinationName ?? "Destinasyon seçilmedi"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>
                  {trip.startDate} → {trip.endDate}
                </p>
                <p>
                  {trip.travelerCount} gezgin
                  {trip.totalBudgetMajor !== null
                    ? ` · ${trip.currencyCode} ${trip.totalBudgetMajor}`
                    : ""}
                </p>
                <p>
                  {trip.dayCount} gün · {trip.itemCount} aktivite
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
