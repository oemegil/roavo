import { describe, expect, it } from "vitest";
import { z } from "zod";

import { formatZodError, parseWithSchema } from "@/lib/validation/http";
import { ValidationError } from "@/lib/errors";

describe("validation foundation", () => {
  const schema = z.object({
    email: z.email(),
    name: z.string().min(1),
  });

  it("parses valid input", () => {
    const result = parseWithSchema(schema, {
      email: "traveler@roavo.app",
      name: "Ada",
    });

    expect(result.name).toBe("Ada");
  });

  it("throws ValidationError for invalid input", () => {
    expect(() => parseWithSchema(schema, { email: "bad", name: "" })).toThrow(
      ValidationError,
    );
  });

  it("formats zod issues safely", () => {
    const parsed = schema.safeParse({ email: "bad", name: "" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const fields = formatZodError(parsed.error);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]).toHaveProperty("path");
    expect(fields[0]).toHaveProperty("message");
  });
});
