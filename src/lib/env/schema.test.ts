import { describe, expect, it } from "vitest";

import { serverEnvSchema } from "@/lib/env/schema";

const validEnv = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://roavo:roavo@localhost:5432/roavo",
  DIRECT_URL: "postgresql://roavo:roavo@localhost:5432/roavo",
  AI_PROVIDER: "fake",
  AUTH_SECRET: "test-auth-secret-with-32-plus-chars!!",
  AUTH_TRUST_HOST: "true",
  DESTINATION_PROVIDER: "internal",
} as const;

describe("serverEnvSchema", () => {
  it("accepts a valid configuration", () => {
    const parsed = serverEnvSchema.safeParse(validEnv);
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid database url", () => {
    const parsed = serverEnvSchema.safeParse({
      ...validEnv,
      DATABASE_URL: "not-a-url",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires AUTH_SECRET", () => {
    const withoutSecret = {
      NODE_ENV: validEnv.NODE_ENV,
      APP_URL: validEnv.APP_URL,
      DATABASE_URL: validEnv.DATABASE_URL,
      DIRECT_URL: validEnv.DIRECT_URL,
      AI_PROVIDER: validEnv.AI_PROVIDER,
      AUTH_TRUST_HOST: validEnv.AUTH_TRUST_HOST,
    };
    const parsed = serverEnvSchema.safeParse(withoutSecret);
    expect(parsed.success).toBe(false);
  });
});
