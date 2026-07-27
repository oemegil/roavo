import { describe, expect, it } from "vitest";

import { assertResourceOwner } from "@/server/domain/authorization";
import { ForbiddenError } from "@/lib/errors";
import { getInitials, toAuthenticatedUser } from "@/features/auth/types";
import type { User, UserProfile } from "@prisma/client";

describe("authorization", () => {
  it("allows matching owners", () => {
    expect(() => assertResourceOwner("u1", "u1")).not.toThrow();
  });

  it("rejects mismatched owners", () => {
    expect(() => assertResourceOwner("u1", "u2")).toThrow(ForbiddenError);
  });
});

describe("user mapper", () => {
  it("maps safe fields only", () => {
    const user = {
      id: "u1",
      email: "a@b.com",
      emailNormalized: "a@b.com",
      passwordHash: "secret-hash",
      status: "ACTIVE",
      role: "USER",
      emailVerifiedAt: null,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as User;

    const profile = {
      id: "p1",
      userId: "u1",
      username: "ada",
      usernameNormalized: "ada",
      displayName: "Ada",
      bio: null,
      avatarUrl: null,
      homeCountryCode: null,
      homeCity: null,
      preferredCurrency: "USD",
      preferredLanguage: "en",
      travelPreferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;

    const mapped = toAuthenticatedUser(user, profile);
    expect(mapped).toMatchObject({
      id: "u1",
      email: "a@b.com",
      username: "ada",
      displayName: "Ada",
    });
    expect(mapped).not.toHaveProperty("passwordHash");
  });

  it("builds initials", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });
});
