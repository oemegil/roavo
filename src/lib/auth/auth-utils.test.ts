import { describe, expect, it } from "vitest";

import { normalizeEmail } from "@/lib/auth/normalize-email";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { normalizeUsername, validateUsername } from "@/lib/auth/username";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Roavo.APP ")).toBe("ada@roavo.app");
  });
});

describe("username", () => {
  it("normalizes case", () => {
    expect(normalizeUsername("Traveler_One")).toBe("traveler_one");
  });

  it("rejects reserved names", () => {
    expect(validateUsername("admin").ok).toBe(false);
  });

  it("accepts valid usernames", () => {
    const result = validateUsername("ada.lovelace");
    expect(result.ok).toBe(true);
  });
});

describe("password policy", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordPolicy("short").ok).toBe(false);
  });

  it("accepts long passwords with spaces", () => {
    expect(validatePasswordPolicy("a secure pass phrase").ok).toBe(true);
  });
});

describe("safe redirect", () => {
  it("allows internal paths", () => {
    expect(getSafeRedirectPath("/trips")).toBe("/trips");
  });

  it("rejects external urls", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/plan");
    expect(getSafeRedirectPath("//evil.example")).toBe("/plan");
  });
});
