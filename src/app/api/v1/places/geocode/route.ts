import { z } from "zod";

import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { geocodePlaces } from "@/integrations/maps/geocode";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

const geocodeBodySchema = z.object({
  places: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        city: z.string().trim().min(1).max(120).optional().nullable(),
      }),
    )
    .min(1)
    .max(80),
});

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    await requireSessionUserId();
    const body = await parseJsonBody(request, geocodeBodySchema);
    const places = await geocodePlaces(body.places);
    return jsonOk(
      {
        places: places.map((place) => ({
          name: place.name,
          city: place.city,
          latitude: place.latitude,
          longitude: place.longitude,
          displayName: place.displayName,
          found: place.found,
        })),
      },
      { correlationId },
    );
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
