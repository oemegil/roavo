"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Map, Sparkles, UserRound } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { followRequestCountQueryKey } from "@/features/traveler/query-keys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

async function fetchPendingFollowRequestCount() {
  const response = await fetch("/api/v1/me/follow-requests/count");
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Bildirimler yüklenemedi.");
  }
  return typeof payload.count === "number" ? payload.count : 0;
}

const navItems = [
  { href: "/plan", label: "Planla", icon: Sparkles },
  { href: "/explore", label: "Keşfet", icon: Compass },
  { href: "/trips", label: "Gezilerim", icon: Map },
  { href: "/profile", label: "Profil", icon: UserRound },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();
  const { data: pendingFollowCount = 0 } = useQuery({
    queryKey: followRequestCountQueryKey,
    queryFn: fetchPendingFollowRequestCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <nav
      aria-label="Ana menü"
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-20 border-t backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = item.href === "/profile" && pendingFollowCount > 0;
          const badgeLabel = pendingFollowCount > 9 ? "9+" : String(pendingFollowCount);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "text-muted-foreground relative flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium",
                  active && "text-foreground bg-muted",
                )}
                aria-label={
                  showBadge
                    ? `Profil, ${pendingFollowCount} bekleyen takip isteği`
                    : item.label
                }
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {showBadge ? (
                    <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
                      {badgeLabel}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppTopBar({ displayName }: { displayName: string }) {
  const { data: pendingFollowCount = 0 } = useQuery({
    queryKey: followRequestCountQueryKey,
    queryFn: fetchPendingFollowRequestCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/plan" className="font-display text-lg font-semibold tracking-tight">
          Roavo
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {pendingFollowCount > 0 ? (
            <Link
              href="/profile#follow-requests"
              className="bg-muted text-foreground hover:bg-muted/80 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {pendingFollowCount} yeni istek
            </Link>
          ) : null}
          <p className="text-muted-foreground truncate text-sm">{displayName}</p>
          <LogoutButton compact />
        </div>
      </div>
    </header>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function onLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    queryClient.clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "sm" : "default"}
      className={compact ? "shrink-0 px-2" : "w-full"}
      onClick={onLogout}
    >
      Çıkış
    </Button>
  );
}
