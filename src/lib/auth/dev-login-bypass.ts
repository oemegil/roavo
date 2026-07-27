import "server-only";

import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/normalize-email";
import {
  createUserWithProfile,
  findUserByNormalizedEmail,
  type UserWithProfile,
} from "@/server/repositories/user-repository";

/** Shortcut: email+password `1` → oemegil@gmail.com (local + deploy). */
export const DEV_LOGIN_BYPASS_EMAIL = "oemegil@gmail.com";
export const DEV_LOGIN_BYPASS_USERNAME = "oemegil";

export function isDevLoginBypass(email: string, password: string): boolean {
  return email.trim() === "1" && password === "1";
}

/** Resolve or create the bypass account. */
export async function resolveDevLoginBypassUser(): Promise<UserWithProfile | null> {
  const emailNormalized = normalizeEmail(DEV_LOGIN_BYPASS_EMAIL);
  const existing = await findUserByNormalizedEmail(emailNormalized);
  if (existing?.profile && existing.status === "ACTIVE") {
    return existing;
  }

  const passwordHash = await hashPassword("1");
  try {
    return await createUserWithProfile({
      email: DEV_LOGIN_BYPASS_EMAIL,
      emailNormalized,
      passwordHash,
      username: DEV_LOGIN_BYPASS_USERNAME,
      usernameNormalized: DEV_LOGIN_BYPASS_USERNAME,
      displayName: "oemegil",
    });
  } catch {
    // Race / unique conflict — re-read
    return findUserByNormalizedEmail(emailNormalized);
  }
}
