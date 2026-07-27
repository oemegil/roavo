import { NextResponse } from "next/server";

import { AppError, isAppError, type AppErrorCode } from "@/lib/errors";
import { getCorrelationIdHeaderName } from "@/lib/utils/correlation-id";
import { createRequestLogger } from "@/lib/logging/logger";

export type ApiErrorBody = {
  error: {
    code: AppErrorCode | string;
    message: string;
    correlationId: string;
    details?: unknown;
  };
};

export function jsonOk<T>(
  data: T,
  init?: {
    status?: number;
    correlationId?: string;
    headers?: HeadersInit;
  },
): NextResponse {
  const headers = new Headers(init?.headers);
  if (init?.correlationId) {
    headers.set(getCorrelationIdHeaderName(), init.correlationId);
  }

  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers,
  });
}

export function jsonError(
  error: AppError | Error | unknown,
  correlationId: string,
): NextResponse {
  const log = createRequestLogger(correlationId);
  const headers = new Headers();
  headers.set(getCorrelationIdHeaderName(), correlationId);

  if (isAppError(error)) {
    log.warn("Application error", {
      code: error.code,
      status: error.status,
      error,
      metadata: error.metadata,
    });

    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        correlationId,
        ...(error.code === "VALIDATION_ERROR" && error.metadata
          ? { details: error.metadata }
          : {}),
      },
    };

    return NextResponse.json(body, { status: error.status, headers });
  }

  log.error("Unhandled server error", { error });

  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again.",
      correlationId,
    },
  };

  return NextResponse.json(body, { status: 500, headers });
}

export function createInternalError(message?: string): AppError {
  return new AppError({
    code: "INTERNAL_ERROR",
    message: message ?? "An unexpected error occurred. Please try again.",
    status: 500,
  });
}
