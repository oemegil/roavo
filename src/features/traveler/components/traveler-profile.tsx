"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getInitials } from "@/features/auth/types";
import { followRequestCountQueryKey } from "@/features/traveler/query-keys";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

type TravelerProfile = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  accountVisibility: "PRIVATE" | "PUBLIC";
  travelerScore: number;
  badge: { id: string; label: string; description: string };
  publicTripCount: number;
  followerCount: number;
  followingCount: number;
  pendingFollowRequestCount: number;
};

type FollowRequest = {
  id: string;
  createdAt: string;
  follower: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    travelerScore: number;
    badge: { id: string; label: string };
  };
};

function ProfileAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="size-20 rounded-full object-cover sm:size-24"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="bg-muted text-foreground font-display flex size-20 items-center justify-center rounded-full text-2xl font-semibold tracking-wide sm:size-24 sm:text-3xl"
    >
      {getInitials(name)}
    </div>
  );
}

export function TravelerProfileClient() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function initial() {
      setLoading(true);
      setError(null);
      const [profileRes, requestsRes] = await Promise.all([
        fetch("/api/v1/me/traveler"),
        fetch("/api/v1/me/follow-requests"),
      ]);
      if (cancelled) return;
      const profilePayload = await profileRes.json().catch(() => null);
      const requestsPayload = await requestsRes.json().catch(() => null);
      if (cancelled) return;
      if (!profileRes.ok) {
        setError(profilePayload?.error?.message ?? "Profil yüklenemedi.");
        setLoading(false);
        return;
      }
      setProfile(profilePayload.profile);
      if (requestsRes.ok) {
        setRequests(requestsPayload.requests ?? []);
      }
      setLoading(false);
    }
    void initial();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleAccountVisibility(nextPublic: boolean) {
    if (!profile) return;
    setTogglingVisibility(true);
    setError(null);
    const visibility = nextPublic ? "PUBLIC" : "PRIVATE";
    const response = await fetch("/api/v1/me/account-visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    const payload = await response.json().catch(() => null);
    setTogglingVisibility(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Hesap görünürlüğü güncellenemedi.");
      return;
    }
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            accountVisibility: payload.accountVisibility,
            pendingFollowRequestCount:
              visibility === "PUBLIC" ? 0 : prev.pendingFollowRequestCount,
          }
        : prev,
    );
    if (visibility === "PUBLIC") {
      setRequests([]);
    }
    void queryClient.invalidateQueries({ queryKey: followRequestCountQueryKey });
  }

  async function acceptRequest(requestId: string) {
    setActingRequestId(requestId);
    const response = await fetch(`/api/v1/me/follow-requests/${requestId}`, {
      method: "POST",
    });
    setActingRequestId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "İstek kabul edilemedi.");
      return;
    }
    setRequests((prev) => prev.filter((row) => row.id !== requestId));
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followerCount: prev.followerCount + 1,
            pendingFollowRequestCount: Math.max(0, prev.pendingFollowRequestCount - 1),
          }
        : prev,
    );
    void queryClient.invalidateQueries({ queryKey: followRequestCountQueryKey });
  }

  async function rejectRequest(requestId: string) {
    setActingRequestId(requestId);
    const response = await fetch(`/api/v1/me/follow-requests/${requestId}`, {
      method: "DELETE",
    });
    setActingRequestId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "İstek reddedilemedi.");
      return;
    }
    setRequests((prev) => prev.filter((row) => row.id !== requestId));
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            pendingFollowRequestCount: Math.max(0, prev.pendingFollowRequestCount - 1),
          }
        : prev,
    );
    void queryClient.invalidateQueries({ queryKey: followRequestCountQueryKey });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Profil</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Profil</AlertTitle>
        <AlertDescription>Profil bulunamadı.</AlertDescription>
      </Alert>
    );
  }

  const scoreLabel = Number.isInteger(profile.travelerScore)
    ? String(profile.travelerScore)
    : profile.travelerScore.toFixed(1);
  const isPublic = profile.accountVisibility === "PUBLIC";

  return (
    <section className="relative space-y-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-4 h-48 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.03_75)_0%,_transparent_70%)]"
      />

      <header className="relative flex items-start gap-4 sm:gap-5">
        <ProfileAvatar name={profile.displayName} avatarUrl={profile.avatarUrl} />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-heading truncate">{profile.displayName}</h1>
            <Link
              href="/settings/profile"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >
              Düzenle
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>
          {profile.bio ? (
            <p className="text-body max-w-prose pt-1">{profile.bio}</p>
          ) : (
            <Link
              href="/settings/profile"
              className="text-muted-foreground hover:text-foreground inline-block pt-1 text-sm underline-offset-4 hover:underline"
            >
              Biyografi ekle
            </Link>
          )}
        </div>
      </header>

      <div className="relative grid grid-cols-4 gap-2 border-y py-5 sm:gap-3">
        <div className="space-y-1 text-center">
          <p className="font-display text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {scoreLabel}
          </p>
          <p className="text-muted-foreground text-caption">Puan</p>
        </div>
        <Link href={`/u/${profile.username}/followers`} className="space-y-1 text-center">
          <p className="font-display text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {profile.followerCount}
          </p>
          <p className="text-muted-foreground text-caption">Takipçi</p>
        </Link>
        <Link href={`/u/${profile.username}/following`} className="space-y-1 text-center">
          <p className="font-display text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {profile.followingCount}
          </p>
          <p className="text-muted-foreground text-caption">Takip</p>
        </Link>
        <Link href="/trips" className="space-y-1 text-center">
          <p className="font-display text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {profile.publicTripCount}
          </p>
          <p className="text-muted-foreground text-caption">Açık gezi</p>
        </Link>
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Hesap görünürlüğü</p>
          <p className="text-muted-foreground text-sm">
            {isPublic
              ? "Public gezilerin Keşfet’te herkese açık."
              : "Public gezilerin yalnızca onaylı takipçilerine açık."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {isPublic ? "Public" : "Private"}
          </span>
          <Switch
            checked={isPublic}
            disabled={togglingVisibility}
            onCheckedChange={(checked) => void toggleAccountVisibility(checked)}
            aria-label="Hesabı public yap"
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Profil</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {requests.length > 0 ? (
        <div id="follow-requests" className="relative scroll-mt-24 space-y-3">
          <div className="space-y-1">
            <p className="text-caption tracking-[0.14em] uppercase">Bekleyen istekler</p>
            <p className="text-muted-foreground text-sm">
              {profile.pendingFollowRequestCount} bekleyen takip isteği
            </p>
          </div>
          <ul className="space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="border-border flex items-center gap-3 rounded-xl border px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${request.follower.username}`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {request.follower.displayName}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    @{request.follower.username} · {request.follower.badge.label} ·{" "}
                    {request.follower.travelerScore} puan
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={actingRequestId === request.id}
                    onClick={() => void acceptRequest(request.id)}
                  >
                    Onayla
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actingRequestId === request.id}
                    onClick={() => void rejectRequest(request.id)}
                  >
                    Reddet
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative space-y-2">
        <p className="text-caption tracking-[0.14em] uppercase">Gezgin yolu</p>
        <p className="text-body text-muted-foreground max-w-prose">
          {profile.badge.description}
        </p>
        <p className="text-muted-foreground text-sm">{profile.badge.label}</p>
      </div>

      <div className="relative">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          Ayarlar
        </Link>
      </div>
    </section>
  );
}
