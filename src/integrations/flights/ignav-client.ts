import "server-only";

import { ExternalServiceError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import type { IgnavSearchRequest, IgnavSearchResponse } from "@/integrations/flights/types";

const IGNAV_BASE = "https://ignav.com/api";

export async function searchIgnavFares(
  request: IgnavSearchRequest,
  signal?: AbortSignal,
): Promise<IgnavSearchResponse> {
  const env = getServerEnv();
  const apiKey = env.IGNAV_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError("Uçuş fiyat servisi yapılandırılmamış.");
  }

  const response = await fetch(`${IGNAV_BASE}/fares/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      adults: 1,
      cabin_class: "economy",
      market: "TR",
      allow_self_transfer: true,
      ...request,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ExternalServiceError(
      `Uçuş araması başarısız (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }

  return (await response.json()) as IgnavSearchResponse;
}
