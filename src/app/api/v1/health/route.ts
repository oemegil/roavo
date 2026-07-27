import { checkDatabaseConnectivity } from "@/server/infrastructure/database";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonOk } from "@/lib/api/response";
import { getCorrelationIdHeaderName } from "@/lib/utils/correlation-id";
import { createRequestLogger } from "@/lib/logging/logger";

export const runtime = "nodejs";

type HealthStatus = "ok" | "degraded";

export async function GET(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  const log = createRequestLogger(correlationId);
  const startedAt = Date.now();

  const databaseHealthy = await checkDatabaseConnectivity();
  const status: HealthStatus = databaseHealthy ? "ok" : "degraded";
  const httpStatus = databaseHealthy ? 200 : 503;

  log.info("Health check", {
    endpoint: "/api/v1/health",
    status,
    database: databaseHealthy ? "up" : "down",
    latencyMs: Date.now() - startedAt,
  });

  const body = {
    status,
    service: "roavo-web",
    version: process.env.npm_package_version ?? "development",
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseHealthy ? "up" : "down",
    },
  };

  const response = jsonOk(body, {
    status: httpStatus,
    correlationId,
  });

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}
