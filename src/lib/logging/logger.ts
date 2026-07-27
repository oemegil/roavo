import "server-only";

import { AppError } from "@/lib/errors";
import { redactObject } from "./redact";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      ...(error.metadata ? { metadata: error.metadata } : {}),
      ...(error.cause instanceof Error
        ? { cause: { name: error.cause.name, message: error.cause.message } }
        : {}),
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack && process.env.NODE_ENV !== "production"
        ? { stack: error.stack.split("\n").slice(0, 8) }
        : {}),
    };
  }

  return { message: "Non-error thrown value", value: String(error) };
}

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (context: LogContext) => Logger;
};

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const { error, ...rest } = context;
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactObject(rest),
    ...(error ? { error: serializeError(error) } : {}),
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

function createLogger(baseContext: LogContext = {}): Logger {
  return {
    debug: (message, context) => write("debug", message, { ...baseContext, ...context }),
    info: (message, context) => write("info", message, { ...baseContext, ...context }),
    warn: (message, context) => write("warn", message, { ...baseContext, ...context }),
    error: (message, context) => write("error", message, { ...baseContext, ...context }),
    child: (context) => createLogger({ ...baseContext, ...context }),
  };
}

export const logger = createLogger({ service: "roavo-web" });

export function createRequestLogger(correlationId: string): Logger {
  return logger.child({ correlationId });
}

export { redactObject } from "./redact";
