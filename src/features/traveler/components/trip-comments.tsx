"use client";

import { useCallback, useEffect, useState } from "react";

import { COMMENT_BODY_MAX } from "@/features/traveler/schemas";
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

type TripComment = {
  id: string;
  body: string;
  createdAt: string;
  canDelete: boolean;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export function TripCommentsSection({
  tripId,
  initialCommentCount,
}: {
  tripId: string;
  initialCommentCount: number;
}) {
  const [comments, setComments] = useState<TripComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string) => {
      const url = cursor
        ? `/api/v1/trips/${tripId}/comments?cursor=${encodeURIComponent(cursor)}`
        : `/api/v1/trips/${tripId}/comments`;
      const response = await fetch(url);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Yorumlar yüklenemedi.");
      }
      return payload as {
        comments: TripComment[];
        commentCount: number;
        nextCursor: string | null;
      };
    },
    [tripId],
  );

  useEffect(() => {
    let cancelled = false;
    async function initial() {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (!cancelled) {
          setComments(data.comments);
          setCommentCount(data.commentCount);
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Yorumlar yüklenemedi.");
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
      setComments((prev) => [...prev, ...data.comments]);
      setCommentCount(data.commentCount);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    const response = await fetch(`/api/v1/trips/${tripId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    const payload = await response.json().catch(() => null);
    setSubmitting(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Yorum eklenemedi.");
      return;
    }
    setBody("");
    setComments((prev) => [payload.comment, ...prev]);
    if (typeof payload.commentCount === "number") {
      setCommentCount(payload.commentCount);
    }
  }

  async function onDelete(commentId: string) {
    setDeletingId(commentId);
    setError(null);
    const response = await fetch(`/api/v1/trips/${tripId}/comments/${commentId}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);
    setDeletingId(null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Yorum silinemedi.");
      return;
    }
    setComments((prev) => prev.filter((row) => row.id !== commentId));
    if (typeof payload.commentCount === "number") {
      setCommentCount(payload.commentCount);
    } else {
      setCommentCount((prev) => Math.max(0, prev - 1));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yorumlar</CardTitle>
        <CardDescription>{commentCount} yorum</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <label className="sr-only" htmlFor="trip-comment">
            Yorum yaz
          </label>
          <textarea
            id="trip-comment"
            value={body}
            maxLength={COMMENT_BODY_MAX}
            rows={3}
            placeholder="Bu plan hakkında ne düşünüyorsun?"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {body.trim().length}/{COMMENT_BODY_MAX}
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || body.trim().length === 0}
            >
              {submitting ? "Gönderiliyor…" : "Yorum yap"}
            </Button>
          </div>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Yorum</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {!loading && comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Henüz yorum yok. İlk yorumu sen yaz.
          </p>
        ) : null}

        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="space-y-1 border-t pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {comment.author.displayName}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · @{comment.author.username}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(comment.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                {comment.canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === comment.id}
                    onClick={() => void onDelete(comment.id)}
                  >
                    Sil
                  </Button>
                ) : null}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
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
            {loadingMore ? "Yükleniyor…" : "Daha fazla yorum"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
