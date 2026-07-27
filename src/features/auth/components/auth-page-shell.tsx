import Link from "next/link";
import type { ReactNode } from "react";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.03_75)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.93_0.03_210)_0%,_transparent_45%)]"
      />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
        <div className="space-y-3">
          <Link href="/" className="text-caption uppercase tracking-[0.2em]">
            Roavo
          </Link>
          <h1 className="text-heading">{title}</h1>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
