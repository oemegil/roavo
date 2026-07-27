import { createTripSchema, listTripsQuerySchema } from "@/features/trips/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireSessionUserId } from "@/lib/auth/session";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/http";
import { createTripService } from "@/server/application/trips/create-trip";
import { listUserTripsService } from "@/server/application/trips/list-trips";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const url = new URL(request.url);
    const query = parseSearchParams(url.searchParams, listTripsQuerySchema);
    const result = await listUserTripsService({
      ownerId,
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    });
    return jsonOk(result, { correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  try {
    const ownerId = await requireSessionUserId();
    const data = await parseJsonBody(request, createTripSchema);
    const trip = await createTripService({ ownerId, data, correlationId });
    return jsonOk({ trip }, { status: 201, correlationId });
  } catch (error) {
    return jsonError(error, correlationId);
  }
}
