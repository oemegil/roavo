import { resolveCorrelationId, getCorrelationIdHeaderName } from "@/lib/utils/correlation-id";

export function getRequestCorrelationId(request: Request): string {
  return resolveCorrelationId(request.headers.get(getCorrelationIdHeaderName()));
}
