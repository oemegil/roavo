import { AppError } from "@/lib/errors";

export function assertValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): void {
  if (latitude == null && longitude == null) return;

  if (latitude == null || longitude == null) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Latitude and longitude must both be provided when setting coordinates.",
      status: 400,
    });
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Latitude must be between -90 and 90.",
      status: 400,
    });
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Longitude must be between -180 and 180.",
      status: 400,
    });
  }
}

export function assertValidRecommendedDuration(
  minimum: number | null | undefined,
  maximum: number | null | undefined,
  maxBound = 30,
): void {
  if (minimum == null && maximum == null) return;

  if (minimum != null && (!Number.isInteger(minimum) || minimum < 1)) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Minimum recommended days must be a positive integer.",
      status: 400,
    });
  }

  if (maximum != null && (!Number.isInteger(maximum) || maximum < 1)) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Maximum recommended days must be a positive integer.",
      status: 400,
    });
  }

  if (minimum != null && maximum != null && minimum > maximum) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: "Minimum recommended days cannot exceed maximum recommended days.",
      status: 400,
    });
  }

  if (
    (minimum != null && minimum > maxBound) ||
    (maximum != null && maximum > maxBound)
  ) {
    throw new AppError({
      code: "DESTINATION_SELECTION_INVALID",
      message: `Recommended trip duration cannot exceed ${maxBound} days.`,
      status: 400,
    });
  }
}

/** Lightweight IANA-like timezone check without a large dependency. */
export function isPlausibleIanaTimezone(value: string): boolean {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/.test(value) && value !== "UTC") {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
