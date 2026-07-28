import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/trips/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/destinations/:path*",
    "/plan",
    "/explore/:path*",
    "/u/:path*",
    "/login",
    "/register",
  ],
};
