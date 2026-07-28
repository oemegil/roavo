"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PublicTripDetail = {
  id: string;
  title: string;
  description: string | null;
  destinationName: string | null;
  startDate: string;
  endDate: string;
  likeCount: number;
  likedByViewer: boolean;
  owner: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    travelerScore: number;
    badge: { id: string; label: string; description: string };
  };
  days: Array<{
    id: string;
    dayNumber: number;
    date: string;
    title: string | null;
    notes: string | null;
    items: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      locationName: string | null;
    }>;
  }>;
};

export function PublicTripDetailClient({
  initialTrip,
  isOwner,
}: {
  initialTrip: PublicTripDetail;
  isOwner: boolean;
}) {
  const [trip, setTrip] = useState(initialTrip);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function toggleLike() {
    if (isOwner) return;
    setPending(true);
    setError(null);
    const method = trip.likedByViewer ? "DELETE" : "POST";
    const response = await fetch(`/api/v1/trips/${trip.id}/like`, { method });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Beğeni güncellenemedi.");
      return;
    }
    setTrip((prev) => ({
      ...prev,
      likedByViewer: payload.liked,
      likeCount:
        typeof payload.likeCount === "number" ? payload.likeCount : prev.likeCount,
    }));
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          <Link href="/explore" className="hover:underline">
            ← Keşfet
          </Link>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-heading">{trip.title}</h1>
            <p className="text-muted-foreground text-body">
              {trip.destinationName ?? "Rota"} · {trip.startDate} → {trip.endDate}
            </p>
            <p className="text-sm">
              {trip.owner.displayName} · {trip.owner.badge.label} ·{" "}
              {trip.owner.travelerScore} puan
            </p>
            {trip.description ? <p className="text-body">{trip.description}</p> : null}
          </div>
          {!isOwner ? (
            <Button
              type="button"
              variant={trip.likedByViewer ? "default" : "outline"}
              disabled={pending}
              onClick={() => void toggleLike()}
              aria-pressed={trip.likedByViewer}
            >
              <Heart
                className="mr-1 size-4"
                fill={trip.likedByViewer ? "currentColor" : "none"}
                aria-hidden
              />
              {trip.likeCount}
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              {trip.likeCount} beğeni · kendi planın
            </p>
          )}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Beğeni</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        {trip.days.map((day) => (
          <Card key={day.id}>
            <CardHeader>
              <CardTitle>
                Gün {day.dayNumber}
                {day.title ? ` · ${day.title}` : ""}
              </CardTitle>
              <CardDescription>{day.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.notes ? (
                <p className="text-sm whitespace-pre-wrap">{day.notes}</p>
              ) : null}
              {day.items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Bu gün için not yok.</p>
              ) : (
                <ul className="space-y-3">
                  {day.items.map((item) => (
                    <li key={item.id} className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      {item.locationName ? (
                        <p className="text-muted-foreground text-sm">
                          {item.locationName}
                        </p>
                      ) : null}
                      {item.description ? (
                        <p className="text-sm whitespace-pre-wrap">{item.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
