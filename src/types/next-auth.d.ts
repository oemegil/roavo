import type { DefaultSession } from "next-auth";
import type { UserStatus } from "@prisma/client";

export type SessionUserFields = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  tokenVersion: number;
};

declare module "next-auth" {
  interface Session {
    user: SessionUserFields & DefaultSession["user"];
  }

  interface User {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
    status?: UserStatus;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
    status?: UserStatus;
    tokenVersion?: number;
  }
}
