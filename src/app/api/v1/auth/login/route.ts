import { AuthError } from "next-auth";

import { loginSchema } from "@/features/auth/schemas";
import { getRequestCorrelationId } from "@/lib/api/request";
import { jsonError, jsonOk } from "@/lib/api/response";
import { signIn } from "@/lib/auth/auth";
import { isDevLoginBypass, resolveDevLoginBypassUser } from "@/lib/auth/dev-login-bypass";
import { normalizeEmail } from "@/lib/auth/normalize-email";
import { authRateLimiter } from "@/lib/auth/rate-limit";
import { AuthInvalidCredentialsError, UnauthorizedError } from "@/lib/errors";
import { parseJsonBody } from "@/lib/validation/http";
import { getCurrentUser } from "@/server/application/get-current-user";
import { findUserByNormalizedEmail } from "@/server/repositories/user-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    authRateLimiter.consume(`login:${ip}`);

    const body = await parseJsonBody(request, loginSchema);

    try {
      await signIn("credentials", {
        email: body.email,
        password: body.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw new AuthInvalidCredentialsError();
      }
      throw error;
    }

    // signIn sets the session cookie on the response; auth() cannot see it
    // on this same request's Cookie header — load the user by email instead.
    const dbUser = isDevLoginBypass(body.email, body.password)
      ? await resolveDevLoginBypassUser()
      : await findUserByNormalizedEmail(normalizeEmail(body.email));
    if (!dbUser) {
      throw new AuthInvalidCredentialsError();
    }

    const user = await getCurrentUser(dbUser.id);

    return jsonOk({ user }, { correlationId });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return jsonError(new AuthInvalidCredentialsError(), correlationId);
    }
    return jsonError(error, correlationId);
  }
}
