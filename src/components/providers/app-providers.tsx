"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "@/lib/query/query-provider";

/**
 * Composition root for client providers.
 * Future: session, theme, toast — add here without changing feature modules.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
