import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HomeShell() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.03_75)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.93_0.03_210)_0%,_transparent_45%)]"
      />

      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16 sm:max-w-xl sm:px-8">
        <div className="space-y-4">
          <p className="text-caption uppercase tracking-[0.2em]">Roavo</p>
          <h1 className="text-display text-foreground">Roavo</h1>
          <p className="text-subheading text-muted-foreground">
            Bu seyahati Roavo&apos;layalım.
          </p>
          <p className="text-body text-muted-foreground max-w-md">
            Tarih aralığını seç, gideceğin yeri belirle — yapay zeka sana özel günlük
            programı oluştursun.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hemen planla</CardTitle>
            <CardDescription>
              Giriş yap veya ücretsiz hesap oluşturarak gezi planına başla.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">Hesap oluştur</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Giriş yap</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
