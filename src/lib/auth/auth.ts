import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { UserStatus } from "@prisma/client";

import { authConfig } from "@/lib/auth/auth.config";
import { authenticateUser } from "@/server/application/authenticate-user";
import { findUserById } from "@/server/repositories/user-repository";
import { prisma } from "@/server/infrastructure/database";
import { loginSchema } from "@/features/auth/schemas";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Auth.js (NextAuth v5) — Node.js runtime.
 * Credentials + JWT; tokenVersion supports revocation after account deletion.
 * Password reset is intentionally out of scope for this phase.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const user = await authenticateUser({
            email: parsed.data.email,
            password: parsed.data.password,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.avatarUrl,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            status: user.status,
            tokenVersion: user.tokenVersion,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatarUrl = user.avatarUrl ?? null;
        token.status = user.status;
        token.tokenVersion = user.tokenVersion ?? 0;
      }

      if (trigger === "update" && session) {
        if (typeof session.displayName === "string") {
          token.displayName = session.displayName;
        }
        if (typeof session.username === "string") {
          token.username = session.username;
        }
        if ("avatarUrl" in session) {
          token.avatarUrl = session.avatarUrl ?? null;
        }
      }

      if (process.env.NEXT_RUNTIME === "edge") {
        return token;
      }

      const tokenId = asString(token.id);
      if (tokenId) {
        const dbUser = await findUserById(tokenId);
        if (!dbUser || dbUser.status !== "ACTIVE") {
          return { ...token, id: undefined, status: "DELETED" as UserStatus };
        }
        if (
          typeof token.tokenVersion === "number" &&
          dbUser.tokenVersion !== token.tokenVersion
        ) {
          return { ...token, id: undefined, status: "DELETED" as UserStatus };
        }
        token.status = dbUser.status;
        token.tokenVersion = dbUser.tokenVersion;
        if (dbUser.profile) {
          token.username = dbUser.profile.username;
          token.displayName = dbUser.profile.displayName;
          token.avatarUrl = dbUser.profile.avatarUrl;
          token.email = dbUser.email;
        }
      }

      return token;
    },
    async session({ session, token }) {
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
      session.user.email = asString(token.email) ?? session.user.email;
      session.user.username = asString(token.username) ?? "";
      session.user.displayName = asString(token.displayName) ?? "";
      session.user.avatarUrl = asString(token.avatarUrl) ?? null;
      session.user.status = status;
      session.user.tokenVersion =
        typeof token.tokenVersion === "number" ? token.tokenVersion : 0;
      session.user.name = asString(token.displayName) ?? session.user.name;
      session.user.image = asString(token.avatarUrl) ?? session.user.image;

      return session;
    },
  },
});
