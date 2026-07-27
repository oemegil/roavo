/**
 * Prevents open redirects by allowing only internal relative paths.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/plan",
): string {
  if (!candidate) {
    return fallback;
  }

  const trimmed = candidate.trim();

  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  if (trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }

  if (trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
