import { describe, expect, it } from "vitest";

import { AppError, ValidationError, isAppError } from "@/lib/errors";
import { err, isErr, isOk, ok } from "@/lib/result";

describe("application errors", () => {
  it("exposes stable codes and status", () => {
    const error = new ValidationError("Invalid payload");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(isAppError(error)).toBe(true);
  });

  it("keeps AppError distinguishable from generic Error", () => {
    expect(isAppError(new Error("nope"))).toBe(false);
    expect(isAppError(new AppError({ code: "INTERNAL_ERROR", message: "x", status: 500 }))).toBe(
      true,
    );
  });
});

describe("result pattern", () => {
  it("represents success and failure", () => {
    const success = ok(42);
    const failure = err(new ValidationError());

    expect(isOk(success)).toBe(true);
    expect(isErr(failure)).toBe(true);
    if (isOk(success)) {
      expect(success.value).toBe(42);
    }
  });
});
