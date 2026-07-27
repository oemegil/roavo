export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR"
  | "AUTH_REQUIRED"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_ACCOUNT_DISABLED"
  | "AUTH_EMAIL_UNAVAILABLE"
  | "AUTH_USERNAME_UNAVAILABLE"
  | "AUTH_INVALID_REGISTRATION"
  | "AUTH_PASSWORD_POLICY_FAILED"
  | "AUTH_RATE_LIMITED"
  | "USER_NOT_FOUND"
  | "USER_PROFILE_INVALID"
  | "USER_PROFILE_CONFLICT"
  | "USER_ACCOUNT_DELETION_FAILED"
  | "TRIP_NOT_FOUND"
  | "TRIP_INVALID_INPUT"
  | "TRIP_DATE_RANGE_INVALID"
  | "TRIP_DATE_RANGE_CONFLICT"
  | "TRIP_DURATION_EXCEEDED"
  | "TRIP_VERSION_CONFLICT"
  | "TRIP_ARCHIVED"
  | "TRIP_DELETED"
  | "TRIP_CREATION_FAILED"
  | "TRIP_UPDATE_FAILED"
  | "TRIP_DAY_NOT_FOUND"
  | "TRIP_DAY_INVALID"
  | "TRIP_DAY_HAS_CONTENT"
  | "TRIP_DAY_REORDER_INVALID"
  | "ITINERARY_ITEM_NOT_FOUND"
  | "ITINERARY_ITEM_INVALID"
  | "ITINERARY_ITEM_MOVE_INVALID"
  | "ITINERARY_ITEM_REORDER_INVALID"
  | "ITINERARY_SCHEDULE_CONFLICT"
  | "DESTINATION_INVALID_QUERY"
  | "DESTINATION_NOT_FOUND"
  | "DESTINATION_INACTIVE"
  | "DESTINATION_SEARCH_FAILED"
  | "DESTINATION_PROVIDER_UNAVAILABLE"
  | "DESTINATION_PROVIDER_RATE_LIMITED"
  | "DESTINATION_SELECTION_INVALID"
  | "DESTINATION_MANUAL_INPUT_INVALID"
  | "TRIP_DESTINATION_UPDATE_FAILED"
  | "AI_INVALID_INPUT"
  | "AI_CONFIGURATION_INVALID"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_RATE_LIMITED"
  | "AI_PROVIDER_REJECTED"
  | "AI_OUTPUT_INVALID"
  | "AI_OUTPUT_REPAIR_FAILED"
  | "AI_DOMAIN_VALIDATION_FAILED"
  | "AI_OPERATION_NOT_FOUND"
  | "AI_OPERATION_CONFLICT"
  | "AI_RATE_LIMITED"
  | "AI_GENERATION_FAILED"
  | "AI_PERSISTENCE_FAILED"
  | "AI_EDIT_INVALID"
  | "AI_EDIT_CONFLICT"
  | "AI_TRIP_VERSION_CONFLICT"
  | "AI_DESTINATION_RECOMMENDATION_FAILED"
  | "AI_ITINERARY_GENERATION_FAILED";

export type AppErrorOptions = {
  code: AppErrorCode;
  message: string;
  status: number;
  cause?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Base application error.
 * `message` is safe for clients. `cause` is server-only and must never be serialized to responses.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly cause?: unknown;
  readonly metadata?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.cause = options.cause;
    this.metadata = options.metadata;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The request could not be validated.",
    metadata?: Record<string, unknown>,
  ) {
    super({
      code: "VALIDATION_ERROR",
      message,
      status: 400,
      metadata,
    });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource could not be found.") {
    super({ code: "NOT_FOUND", message, status: 404 });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Oturum açmanız gerekiyor.") {
    super({ code: "AUTH_REQUIRED", message, status: 401 });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super({ code: "FORBIDDEN", message, status: 403 });
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "İstek mevcut durumla çakışıyor.") {
    super({ code: "CONFLICT", message, status: 409 });
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.") {
    super({ code: "AUTH_RATE_LIMITED", message, status: 429 });
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    message = "Harici bir servis geçici olarak kullanılamıyor.",
    cause?: unknown,
  ) {
    super({
      code: "EXTERNAL_SERVICE_ERROR",
      message,
      status: 502,
      cause,
    });
    this.name = "ExternalServiceError";
  }
}

export class AuthInvalidCredentialsError extends AppError {
  constructor() {
    super({
      code: "AUTH_INVALID_CREDENTIALS",
      message: "E-posta veya şifre hatalı.",
      status: 401,
    });
    this.name = "AuthInvalidCredentialsError";
  }
}

export class AuthAccountDisabledError extends AppError {
  constructor() {
    super({
      code: "AUTH_ACCOUNT_DISABLED",
      message: "Bu hesap kullanılamıyor.",
      status: 403,
    });
    this.name = "AuthAccountDisabledError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
