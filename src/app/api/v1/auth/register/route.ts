import { AuthError } from "next-auth";

import { registerSchema } from "@/features/auth/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { registrationRateLimiter } from "@/lib/auth/rate-limit";
import { signIn } from "@/lib/auth/auth";
import { ValidationError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { registerUser } from "@/server/application/register-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    registrationRateLimiter.consume(`register:${ip}`);

    const body = await parseJsonBody(request, registerSchema);
    const user = await registerUser(body, correlationId);

    try {
      await signIn("credentials", {
        email: body.email,
        password: body.password,
        redirect: false,
      });
    } catch (error) {
      if (!(error instanceof AuthError)) {
        throw error;
      }
    }

    return jsonOk(
      { user },
      {
        status: 201,
        correlationId,
      },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonError(
        new ValidationError("Registration details could not be validated.", error.metadata),
        correlationId,
      );
    }
    return jsonError(error, correlationId);
  }
}
