import { z } from "zod";

import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { searchPlaceCandidates } from "@/integrations/maps/geocode";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

const placeSearchSchema = z.object({
  q: z.string().trim().min(2).max(160),
  city: z.string().trim().min(1).max(120).optional().nullable(),
  limit: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    await requireSessionUserId();
    const body = await parseJsonBody(request, placeSearchSchema);
    const places = await searchPlaceCandidates({
      q: body.q,
      city: body.city,
      limit: body.limit,
    });
    return jsonOk({ places }, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
