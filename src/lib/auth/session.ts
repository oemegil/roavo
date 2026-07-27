import "server-only";

import { auth } from "@/lib/auth/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return null;
  }
  return session.user.id;
}

export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}
