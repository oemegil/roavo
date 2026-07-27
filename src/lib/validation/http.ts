import { z } from "zod";

import { ValidationError } from "@/lib/errors";

export type FieldError = {
  path: string;
  message: string;
};

export function formatZodError(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

export function parseWithSchema<T extends z.ZodType>(
  schema: T,
  data: unknown,
  message = "The request could not be validated.",
): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(message, {
      fields: formatZodError(parsed.error),
    });
  }
  return parsed.data;
}

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }

  return parseWithSchema(schema, body);
}

export function parseSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T,
): z.infer<T> {
  const data = Object.fromEntries(searchParams.entries());
  return parseWithSchema(schema, data, "Query parameters could not be validated.");
}

export function parseRouteParams<T extends z.ZodType>(
  params: Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  return parseWithSchema(schema, params, "Route parameters could not be validated.");
}
