"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

import { TripCommentsSection } from "@/features/traveler/components/trip-comments";
import type { TripSummaryDto } from "@/features/trips/dto";
import { ROAVO_BRAND } from "@/lib/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export function TripsListClient({
  initialStatus,
}: {
  initialStatus: "DRAFT" | "ARCHIVED";
}) {
  const [status, setStatus] = useState<"DRAFT" | "ARCHIVED">(initialStatus);
  const [trips, setTrips] = useState<TripSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setOpenCommentsId(null);
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

  async function setVisibility(trip: TripSummaryDto, visibility: "PRIVATE" | "PUBLIC") {
    if (trip.status === "ARCHIVED") return;
    if ((trip.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE") === visibility) {
      return;
    }
    setTogglingId(trip.id);
    setError(null);
    const response = await fetch(`/api/v1/trips/${trip.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    const payload = await response.json().catch(() => null);
    setTogglingId(null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Görünürlük güncellenemedi.");
      return;
    }
    setTrips((prev) =>
      prev.map((row) =>
        row.id === trip.id
          ? {
              ...row,
              visibility: payload.trip?.visibility ?? visibility,
            }
          : row,
      ),
    );
    if (visibility === "PRIVATE" && openCommentsId === trip.id) {
      setOpenCommentsId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Gezilerin</h1>
        <p className="text-muted-foreground text-sm tracking-wide">
          {ROAVO_BRAND.identity}
        </p>
        <p className="text-muted-foreground text-body">
          Kayıtlı planların burada. Yeni plan için alt menüden Planla’ya geç.
        </p>
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
          <AlertTitle>Geziler</AlertTitle>
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
                ? "Planla’dan AI programı oluştur veya yaptığın bir gezinin kaydını ekle."
                : "Arşivlenen geziler burada görünür."}
            </CardDescription>
          </CardHeader>
          {status === "DRAFT" ? (
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/plan">AI ile planla</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/plan?tab=manual">Gezi kaydı ekle</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => {
          const visibility = trip.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
          const isPublic = visibility === "PUBLIC";
          const commentsOpen = openCommentsId === trip.id;
          return (
            <Card
              key={trip.id}
              className={
                commentsOpen
                  ? "hover:border-primary/40 transition-colors sm:col-span-2"
                  : "hover:border-primary/40 h-full transition-colors"
              }
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  <Link href={`/trips/${trip.id}`} className="hover:underline">
                    {trip.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {trip.destinationName ?? "Destinasyon seçilmedi"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3 text-sm">
                <div className="space-y-1">
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
                </div>

                {trip.status !== "ARCHIVED" ? (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium">
                        Keşfet’te paylaş
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isPublic ? "Herkese açık" : "Şu an özel"}
                      </p>
                    </div>
                    <Switch
                      checked={isPublic}
                      disabled={togglingId === trip.id}
                      aria-label={`${trip.title} için Keşfet paylaşımı`}
                      onCheckedChange={(checked) =>
                        void setVisibility(trip, checked ? "PUBLIC" : "PRIVATE")
                      }
                    />
                  </div>
                ) : (
                  <p>{isPublic ? "Herkese açıktı" : "Özeldi"}</p>
                )}

                {isPublic ? (
                  <div className="border-border space-y-3 border-t pt-3">
                    <div className="text-foreground flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Heart className="size-4" aria-hidden />
                        {trip.likeCount} beğeni
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <MessageCircle className="size-4" aria-hidden />
                        {trip.commentCount} yorum
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto px-2"
                        onClick={() => setOpenCommentsId(commentsOpen ? null : trip.id)}
                      >
                        {commentsOpen ? "Yorumları gizle" : "Yorumları gör"}
                      </Button>
                    </div>

                    {commentsOpen ? (
                      <TripCommentsSection
                        key={trip.id}
                        tripId={trip.id}
                        initialCommentCount={trip.commentCount}
                        variant="embedded"
                        onCommentCountChange={(count) =>
                          setTrips((prev) =>
                            prev.map((row) =>
                              row.id === trip.id ? { ...row, commentCount: count } : row,
                            ),
                          )
                        }
                      />
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
