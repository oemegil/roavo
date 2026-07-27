import { describe, expect, it } from "vitest";

import {
  createCorrelationId,
  resolveCorrelationId,
} from "@/lib/utils/correlation-id";

describe("correlation id", () => {
  it("generates a non-empty id", () => {
    expect(createCorrelationId().length).toBeGreaterThan(8);
  });

  it("accepts safe external ids", () => {
    expect(resolveCorrelationId("req-123")).toBe("req-123");
  });

  it("rejects unsafe external ids", () => {
    const resolved = resolveCorrelationId("bad id with spaces!!!!");
    expect(resolved).not.toBe("bad id with spaces!!!!");
  });
});
