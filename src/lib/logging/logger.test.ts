import { describe, expect, it } from "vitest";

import { redactObject } from "@/lib/logging/redact";

describe("logger redaction", () => {
  it("redacts sensitive keys", () => {
    const redacted = redactObject({
      password: "secret",
      apiKey: "key",
      userId: "abc",
    });

    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.userId).toBe("abc");
  });
});
