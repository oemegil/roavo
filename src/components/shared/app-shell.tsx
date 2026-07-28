"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Map, Sparkles, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/plan", label: "Planla", icon: Sparkles },
  { href: "/explore", label: "Keşfet", icon: Compass },
  { href: "/trips", label: "Gezilerim", icon: Map },
  { href: "/profile", label: "Profil", icon: UserRound },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Ana menü"
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-20 border-t backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "text-muted-foreground flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium",
                  active && "text-foreground bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
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
  return (
    <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/plan" className="font-display text-lg font-semibold tracking-tight">
          Roavo
        </Link>
        <div className="flex min-w-0 items-center gap-2">
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
