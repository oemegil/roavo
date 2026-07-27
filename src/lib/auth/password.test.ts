import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies passwords", async () => {
    const password = "a-secure-password";
    const hashed = await hashPassword(password);
    expect(hashed).not.toContain(password);
    expect(await verifyPassword(hashed, password)).toBe(true);
    expect(await verifyPassword(hashed, "wrong-password")).toBe(false);
  });
});
