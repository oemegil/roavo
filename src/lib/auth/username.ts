const USERNAME_PATTERN = /^[a-z0-9._]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;

export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "login",
  "logout",
  "register",
  "settings",
  "support",
  "system",
  "trips",
  "explore",
  "roavo",
  "www",
  "me",
  "profile",
  "account",
  "help",
  "null",
  "undefined",
]);

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export type UsernameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

export function validateUsername(username: string): UsernameValidationResult {
  const normalized = normalizeUsername(username);

  if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) {
    return {
      ok: false,
      message: `Username must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
    };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      ok: false,
      message: "Username may only contain lowercase letters, numbers, periods, and underscores.",
    };
  }

  if (normalized.startsWith(".") || normalized.endsWith(".")) {
    return { ok: false, message: "Username cannot start or end with a period." };
  }

  if (normalized.includes("..")) {
    return { ok: false, message: "Username cannot contain consecutive periods." };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { ok: false, message: "This username is not available." };
  }

  return { ok: true, normalized };
}
