"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getInitials } from "@/features/auth/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PublicTravelerProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  accountVisibility: "PRIVATE" | "PUBLIC";
  travelerScore: number;
  badge: { id: string; label: string };
  followerCount: number;
  followingCount: number;
  publicTripCount: number | null;
  canViewContent: boolean;
  isSelf: boolean;
  followStatus: "PENDING" | "ACTIVE" | null;
};

type PublicTripCard = {
  id: string;
  title: string;
  description: string | null;
  destinationName: string | null;
  destinationRegion: string | null;
  startDate: string;
  endDate: string;
  dayCount: number;
  likeCount: number;
  commentCount: number;
};

function Avatar({
  name,
  avatarUrl,
  size = "lg",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "lg" | "sm";
}) {
  const className =
    size === "lg"
      ? "size-20 rounded-full object-cover sm:size-24"
      : "size-10 rounded-full object-cover";
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className={className} />
    );
  }
  return (
    <div
      aria-hidden
      className={`bg-muted text-foreground flex items-center justify-center rounded-full font-semibold ${
        size === "lg"
          ? "font-display size-20 text-2xl sm:size-24 sm:text-3xl"
          : "size-10 text-xs"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

export function PublicTravelerProfileClient({ username }: { username: string }) {
  const [profile, setProfile] = useState<PublicTravelerProfile | null>(null);
  const [trips, setTrips] = useState<PublicTripCard[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  async function loadTrips(forUsername: string) {
    setTripsLoading(true);
    const response = await fetch(
      `/api/v1/travelers/${encodeURIComponent(forUsername)}/trips`,
    );
    const payload = await response.json().catch(() => null);
    setTripsLoading(false);
    if (!response.ok) {
      setTrips([]);
      return;
    }
    setTrips(payload.trips ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    async function initial() {
      setLoading(true);
      setError(null);
      setTrips([]);
      const response = await fetch(`/api/v1/travelers/${encodeURIComponent(username)}`);
      const payload = await response.json().catch(() => null);
      if (cancelled) return;
      if (!response.ok) {
        setError(payload?.error?.message ?? "Profil yüklenemedi.");
        setLoading(false);
        return;
      }
      const nextProfile = payload.profile as PublicTravelerProfile;
      setProfile(nextProfile);
      setLoading(false);
      if (nextProfile.canViewContent) {
        setTripsLoading(true);
        const tripsRes = await fetch(
          `/api/v1/travelers/${encodeURIComponent(username)}/trips`,
        );
        const tripsPayload = await tripsRes.json().catch(() => null);
        if (cancelled) return;
        setTripsLoading(false);
        if (tripsRes.ok) {
          setTrips(tripsPayload.trips ?? []);
        }
      }
    }
    void initial();
    return () => {
      cancelled = true;
    };
  }, [username]);

  async function reload() {
    const response = await fetch(`/api/v1/travelers/${encodeURIComponent(username)}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Profil yüklenemedi.");
      return;
    }
    const nextProfile = payload.profile as PublicTravelerProfile;
    setProfile(nextProfile);
    if (nextProfile.canViewContent) {
      await loadTrips(username);
    } else {
      setTrips([]);
    }
  }

  async function follow() {
    if (!profile) return;
    setActing(true);
    const response = await fetch(
      `/api/v1/travelers/${encodeURIComponent(profile.username)}/follow`,
      { method: "POST" },
    );
    const payload = await response.json().catch(() => null);
    setActing(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Takip edilemedi.");
      return;
    }
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followStatus: payload.status,
            followerCount:
              payload.status === "ACTIVE"
                ? prev.followerCount + (prev.followStatus === "ACTIVE" ? 0 : 1)
                : prev.followerCount,
            canViewContent:
              payload.status === "ACTIVE" || prev.accountVisibility === "PUBLIC"
                ? true
                : prev.canViewContent,
          }
        : prev,
    );
    if (payload.status === "ACTIVE") {
      void reload();
    }
  }

  async function unfollow() {
    if (!profile) return;
    setActing(true);
    const response = await fetch(
      `/api/v1/travelers/${encodeURIComponent(profile.username)}/follow`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => null);
    setActing(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Takip bırakılamadı.");
      return;
    }
    void reload();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gezgin</AlertTitle>
        <AlertDescription>{error ?? "Profil bulunamadı."}</AlertDescription>
      </Alert>
    );
  }

  const scoreLabel = Number.isInteger(profile.travelerScore)
    ? String(profile.travelerScore)
    : profile.travelerScore.toFixed(1);

  return (
    <section className="space-y-8">
      <header className="flex items-start gap-4 sm:gap-5">
        <Avatar name={profile.displayName} avatarUrl={profile.avatarUrl} />
        <div className="min-w-0 flex-1 space-y-3 pt-1">
          <div className="space-y-1">
            <h1 className="text-heading truncate">{profile.displayName}</h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>
          {profile.isSelf ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Kendi profilin</Link>
            </Button>
          ) : profile.followStatus === "ACTIVE" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={acting}
              onClick={() => void unfollow()}
            >
              Takibi bırak
            </Button>
          ) : profile.followStatus === "PENDING" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={acting}
              onClick={() => void unfollow()}
            >
              İstek gönderildi
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={acting}
              onClick={() => void follow()}
            >
              {profile.accountVisibility === "PRIVATE"
                ? "Takip isteği gönder"
                : "Takip et"}
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 border-y py-5">
        <div className="space-y-1 text-center">
          <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">
            {scoreLabel}
          </p>
          <p className="text-muted-foreground text-caption">Puan</p>
        </div>
        {profile.canViewContent || profile.isSelf ? (
          <>
            <Link
              href={`/u/${profile.username}/followers`}
              className="space-y-1 text-center"
            >
              <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">
                {profile.followerCount}
              </p>
              <p className="text-muted-foreground text-caption">Takipçi</p>
            </Link>
            <Link
              href={`/u/${profile.username}/following`}
              className="space-y-1 text-center"
            >
              <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">
                {profile.followingCount}
              </p>
              <p className="text-muted-foreground text-caption">Takip</p>
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">
                {profile.followerCount}
              </p>
              <p className="text-muted-foreground text-caption">Takipçi</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">
                {profile.followingCount}
              </p>
              <p className="text-muted-foreground text-caption">Takip</p>
            </div>
          </>
        )}
      </div>

      {profile.canViewContent ? (
        <div className="space-y-6">
          <div className="space-y-2">
            {profile.bio ? <p className="text-body">{profile.bio}</p> : null}
            <p className="text-muted-foreground text-sm">
              {profile.badge.label}
              {profile.publicTripCount !== null
                ? ` · ${profile.publicTripCount} açık gezi`
                : null}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-caption tracking-[0.14em] uppercase">Açık geziler</p>
            {tripsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ) : null}
            {!tripsLoading && trips.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Henüz paylaşılan public gezi yok.
              </p>
            ) : null}
            <ul className="space-y-3">
              {trips.map((trip) => {
                const place =
                  trip.destinationRegion ||
                  trip.destinationName ||
                  `${trip.startDate} → ${trip.endDate}`;
                return (
                  <li key={trip.id}>
                    <Link
                      href={`/explore/${trip.id}`}
                      className="border-border hover:border-primary/40 block overflow-hidden rounded-xl border transition-colors"
                    >
                      <div className="flex min-h-28 flex-col justify-end bg-gradient-to-br from-slate-900 via-slate-700 to-amber-600 p-4 text-white">
                        <p className="text-[11px] tracking-[0.16em] uppercase opacity-80">
                          {trip.dayCount} gün · {place}
                        </p>
                        <h2 className="font-display mt-1 text-xl leading-tight font-semibold">
                          {trip.title}
                        </h2>
                        {trip.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-white/85">
                            {trip.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-white/70">
                          {trip.likeCount} beğeni · {trip.commentCount} yorum
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="border-border rounded-xl border px-4 py-6 text-center">
          <p className="font-medium">Bu hesap private</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Public gezilerini görmek için takip isteği gönder.
          </p>
        </div>
      )}
    </section>
  );
}
