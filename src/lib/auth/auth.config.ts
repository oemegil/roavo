import type { NextAuthConfig } from "next-auth";
import type { UserStatus } from "@prisma/client";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Edge-compatible Auth.js config (no Prisma / native deps).
 * Used by middleware. Full config with Credentials lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  providers: [],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      const id = asString(token.id);
      const status = (asString(token.status) as UserStatus | undefined) ?? "DELETED";

      if (!id || status !== "ACTIVE") {
        session.user.id = "";
        session.user.username = "";
        session.user.displayName = "";
        session.user.avatarUrl = null;
        session.user.status = status;
        session.user.tokenVersion = -1;
        return session;
      }

      session.user.id = id;
      session.user.username = asString(token.username) ?? "";
      session.user.displayName = asString(token.displayName) ?? "";
      session.user.avatarUrl = asString(token.avatarUrl) ?? null;
      session.user.status = status;
      session.user.tokenVersion =
        typeof token.tokenVersion === "number" ? token.tokenVersion : 0;
      const email = asString(token.email);
      if (email) {
        session.user.email = email;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      const isLoggedIn = !!auth?.user?.id && auth.user.status === "ACTIVE";
      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isProtected =
        pathname.startsWith("/trips") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/destinations") ||
        pathname.startsWith("/plan") ||
        pathname.startsWith("/explore") ||
        pathname.startsWith("/u");

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(
          new URL(
            getSafeRedirectPath(request.nextUrl.searchParams.get("callbackUrl"), "/plan"),
            request.nextUrl.origin,
          ),
        );
      }

      if (!isLoggedIn && isProtected) {
        const loginUrl = new URL("/login", request.nextUrl.origin);
        loginUrl.searchParams.set(
          "callbackUrl",
          getSafeRedirectPath(`${pathname}${search}`, "/plan"),
        );
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
