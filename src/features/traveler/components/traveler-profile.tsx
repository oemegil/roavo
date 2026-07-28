"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type TravelerProfile = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  travelerScore: number;
  badge: { id: string; label: string; description: string };
  publicTripCount: number;
  verificationComingSoon: boolean;
};

export function TravelerProfileClient() {
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/v1/me/traveler");
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (!cancelled) {
          setError(payload?.error?.message ?? "Profil yüklenemedi.");
          setLoading(false);
        }
        return;
      }
      if (!cancelled) {
        setProfile(payload.profile);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Profil</AlertTitle>
        <AlertDescription>{error ?? "Profil bulunamadı."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">{profile.displayName}</h1>
        <p className="text-muted-foreground text-body">@{profile.username}</p>
        {profile.bio ? <p className="text-body">{profile.bio}</p> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gezgin puanı</CardTitle>
          <CardDescription>{profile.badge.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{profile.travelerScore}</p>
          <p className="text-sm font-medium">{profile.badge.label}</p>
          <p className="text-muted-foreground text-sm">
            {profile.publicTripCount} public gezi
          </p>
          {profile.verificationComingSoon ? (
            <p className="text-muted-foreground text-sm">
              Fotoğraf doğrulama yakında — ekstra +3 puan için rezerv.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/settings/profile">Profili düzenle</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Keşfet</Link>
        </Button>
        <Button asChild>
          <Link href="/trips">Gezilerim</Link>
        </Button>
      </div>
    </section>
  );
}
