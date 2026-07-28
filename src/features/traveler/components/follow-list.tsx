"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getInitials } from "@/features/auth/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TravelerCard = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  travelerScore: number;
  badge: { id: string; label: string };
  accountVisibility: "PRIVATE" | "PUBLIC";
};

export function FollowListClient({
  username,
  direction,
}: {
  username: string;
  direction: "followers" | "following";
}) {
  const [travelers, setTravelers] = useState<TravelerCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string) => {
      const path =
        direction === "followers"
          ? `/api/v1/travelers/${encodeURIComponent(username)}/followers`
          : `/api/v1/travelers/${encodeURIComponent(username)}/following`;
      const url = cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path;
      const response = await fetch(url);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Liste yüklenemedi.");
      }
      return payload as { travelers: TravelerCard[]; nextCursor: string | null };
    },
    [direction, username],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const payload = await load();
        if (!cancelled) {
          setTravelers(payload.travelers);
          setNextCursor(payload.nextCursor);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const payload = await load(nextCursor);
      setTravelers((prev) => [...prev, ...payload.travelers]);
      setNextCursor(payload.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }

  const title = direction === "followers" ? "Takipçiler" : "Takip edilenler";

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <Link
          href={`/u/${username}`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← @{username}
        </Link>
        <h1 className="text-heading">{title}</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && travelers.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz kimse yok.</p>
      ) : null}

      <ul className="space-y-3">
        {travelers.map((traveler) => (
          <li key={traveler.id}>
            <Link
              href={`/u/${traveler.username}`}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-xl px-1 py-2 transition-colors"
            >
              {traveler.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={traveler.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="bg-muted flex size-10 items-center justify-center rounded-full text-xs font-semibold"
                >
                  {getInitials(traveler.displayName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{traveler.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">
                  @{traveler.username} · {traveler.badge.label} · {traveler.travelerScore}{" "}
                  puan
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <Button
          type="button"
          variant="outline"
          disabled={loadingMore}
          onClick={() => void loadMore()}
        >
          {loadingMore ? "Yükleniyor…" : "Daha fazla"}
        </Button>
      ) : null}
    </section>
  );
}
