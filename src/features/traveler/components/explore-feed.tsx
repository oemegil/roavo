"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Compass, Heart } from "lucide-react";

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

type ExploreTrip = {
  id: string;
  title: string;
  destinationName: string | null;
  startDate: string;
  endDate: string;
  dayCount: number;
  likeCount: number;
  likedByViewer: boolean;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    travelerScore: number;
    badge: { id: string; label: string };
  };
  updatedAt: string;
};

export function ExploreFeedClient() {
  const [trips, setTrips] = useState<ExploreTrip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/v1/explore?cursor=${encodeURIComponent(cursor)}`
      : "/api/v1/explore";
    const response = await fetch(url);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Keşfet yüklenemedi.");
    }
    return payload as { trips: ExploreTrip[]; nextCursor: string | null };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initial() {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (!cancelled) {
          setTrips(data.trips);
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Keşfet yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initial();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await load(nextCursor);
      setTrips((prev) => [...prev, ...data.trips]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleLike(trip: ExploreTrip) {
    setLikingId(trip.id);
    setError(null);
    const method = trip.likedByViewer ? "DELETE" : "POST";
    const response = await fetch(`/api/v1/trips/${trip.id}/like`, { method });
    const payload = await response.json().catch(() => null);
    setLikingId(null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Beğeni güncellenemedi.");
      return;
    }
    setTrips((prev) =>
      prev.map((row) =>
        row.id === trip.id
          ? {
              ...row,
              likedByViewer: payload.liked,
              likeCount:
                typeof payload.likeCount === "number" ? payload.likeCount : row.likeCount,
            }
          : row,
      ),
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading flex items-center gap-2">
          <Compass className="size-6" aria-hidden />
          Keşfet
        </h1>
        <p className="text-muted-foreground text-body">
          Topluluğun public planlarını gezgin puanına ve beğenilere göre sırala.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Bir sorun oluştu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && trips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Henüz public gezi yok</CardTitle>
            <CardDescription>
              Bir geziyi ayarlardan herkese açık yapınca burada görünür.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ul className="space-y-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate">
                      <Link href={`/explore/${trip.id}`} className="hover:underline">
                        {trip.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {trip.destinationName ?? "Rota"} · {trip.dayCount} gün ·{" "}
                      {trip.startDate} → {trip.endDate}
                    </CardDescription>
                    <p className="text-muted-foreground text-sm">
                      {trip.owner.displayName} · {trip.owner.badge.label} ·{" "}
                      {trip.owner.travelerScore} puan
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={trip.likedByViewer ? "default" : "outline"}
                    size="sm"
                    disabled={likingId === trip.id}
                    onClick={() => void toggleLike(trip)}
                    aria-pressed={trip.likedByViewer}
                  >
                    <Heart
                      className="mr-1 size-4"
                      fill={trip.likedByViewer ? "currentColor" : "none"}
                      aria-hidden
                    />
                    {trip.likeCount}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="px-0">
                  <Link href={`/explore/${trip.id}`}>Planı incele</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loadingMore}
          onClick={() => void loadMore()}
        >
          {loadingMore ? "Yükleniyor…" : "Daha fazla"}
        </Button>
      ) : null}
    </section>
  );
}
