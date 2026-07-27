import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id configuration tuned for interactive logins on Node.js (Vercel-compatible).
 * memoryCost is in KiB (65536 = 64 MiB).
 */
const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
