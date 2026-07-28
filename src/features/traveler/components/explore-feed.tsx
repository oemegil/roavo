"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

import { getInitials } from "@/features/auth/types";
import { COMMENT_BODY_MAX } from "@/features/traveler/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ExploreComment = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
};

type ExploreTrip = {
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
  likedByViewer: boolean;
  recentComments: ExploreComment[];
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

function AvatarBubble({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover" />
    );
  }
  return (
    <div
      aria-hidden
      className="bg-muted text-foreground flex size-9 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
    >
      {getInitials(name)}
    </div>
  );
}

export function ExploreFeedClient() {
  const [trips, setTrips] = useState<ExploreTrip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [draftByTrip, setDraftByTrip] = useState<Record<string, string>>({});
  const [postingId, setPostingId] = useState<string | null>(null);

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

  async function postComment(trip: ExploreTrip) {
    const body = (draftByTrip[trip.id] ?? "").trim();
    if (!body) return;
    setPostingId(trip.id);
    setError(null);
    const response = await fetch(`/api/v1/trips/${trip.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const payload = await response.json().catch(() => null);
    setPostingId(null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Yorum eklenemedi.");
      return;
    }
    const comment = payload.comment as ExploreComment;
    setDraftByTrip((prev) => ({ ...prev, [trip.id]: "" }));
    setTrips((prev) =>
      prev.map((row) =>
        row.id === trip.id
          ? {
              ...row,
              commentCount:
                typeof payload.commentCount === "number"
                  ? payload.commentCount
                  : row.commentCount + 1,
              recentComments: [comment, ...row.recentComments].slice(0, 3),
            }
          : row,
      ),
    );
  }

  return (
    <section className="mx-auto w-full max-w-lg space-y-5">
      <div className="space-y-1">
        <h1 className="text-heading">Keşfet</h1>
        <p className="text-muted-foreground text-sm">
          Başkalarının planları, yorumlar ve gün batımları.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Bir sorun oluştu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && trips.length === 0 ? (
        <div className="border-border rounded-2xl border px-5 py-10 text-center">
          <p className="font-medium">Şimdilik sessiz</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Başkaları public plan paylaşınca burada görünür.
          </p>
        </div>
      ) : null}

      <ul className="space-y-6">
        {trips.map((trip) => {
          const placeLine =
            trip.destinationRegion ||
            trip.destinationName ||
            `${trip.startDate} → ${trip.endDate}`;
          const draft = draftByTrip[trip.id] ?? "";
          return (
            <li
              key={trip.id}
              className="border-border bg-muted/30 overflow-hidden rounded-2xl border"
            >
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <AvatarBubble
                  name={trip.owner.displayName}
                  avatarUrl={trip.owner.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {trip.owner.displayName}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · @{trip.owner.username}
                    </span>
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {trip.owner.badge.label} · {trip.owner.travelerScore} puan
                  </p>
                </div>
              </div>

              <div className="relative px-4 pb-3">
                <div className="flex min-h-44 flex-col justify-end rounded-xl bg-gradient-to-br from-slate-900 via-slate-700 to-amber-600 p-5 text-white shadow-inner">
                  <p className="text-[11px] tracking-[0.18em] uppercase opacity-80">
                    {trip.dayCount} gün · {placeLine}
                  </p>
                  <h2 className="font-display mt-2 text-2xl leading-tight font-semibold">
                    {trip.title}
                  </h2>
                  {trip.description ? (
                    <p className="mt-2 line-clamp-3 text-sm text-white/85">
                      {trip.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5", trip.likedByViewer && "text-red-600")}
                  disabled={likingId === trip.id}
                  onClick={() => void toggleLike(trip)}
                  aria-pressed={trip.likedByViewer}
                >
                  <Heart
                    className="size-5"
                    fill={trip.likedByViewer ? "currentColor" : "none"}
                    aria-hidden
                  />
                  {trip.likeCount}
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                >
                  <Link href={`/explore/${trip.id}#comments`}>
                    <MessageCircle className="size-5" aria-hidden />
                    {trip.commentCount}
                  </Link>
                </Button>
              </div>

              <div className="space-y-2 px-4 pb-3">
                <p className="text-sm">
                  <span className="font-semibold">{trip.owner.username}</span>{" "}
                  <span className="text-foreground/90">{trip.title}</span>
                </p>

                {trip.recentComments.length > 0 ? (
                  <ul className="space-y-1.5">
                    {[...trip.recentComments].reverse().map((comment) => (
                      <li key={comment.id} className="text-sm">
                        <span className="font-semibold">{comment.author.username}</span>{" "}
                        <span className="text-foreground/90">{comment.body}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">Henüz yorum yok.</p>
                )}

                {trip.commentCount > trip.recentComments.length ? (
                  <Link
                    href={`/explore/${trip.id}#comments`}
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    {trip.commentCount} yorumun tümünü gör
                  </Link>
                ) : null}

                <Link
                  href={`/explore/${trip.id}`}
                  className="text-muted-foreground text-sm hover:underline"
                >
                  Planı aç
                </Link>
              </div>

              <form
                className="border-border flex items-center gap-2 border-t px-3 py-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void postComment(trip);
                }}
              >
                <input
                  value={draft}
                  maxLength={COMMENT_BODY_MAX}
                  placeholder="Yorum ekle…"
                  className="placeholder:text-muted-foreground flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                  onChange={(event) =>
                    setDraftByTrip((prev) => ({
                      ...prev,
                      [trip.id]: event.target.value,
                    }))
                  }
                  disabled={postingId === trip.id}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={postingId === trip.id || draft.trim().length === 0}
                  className="text-foreground font-semibold"
                >
                  Paylaş
                </Button>
              </form>
            </li>
          );
        })}
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
