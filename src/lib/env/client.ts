import { clientEnvSchema, type ClientEnv } from "./schema";

let cachedEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    throw new Error("Invalid client environment configuration.");
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
