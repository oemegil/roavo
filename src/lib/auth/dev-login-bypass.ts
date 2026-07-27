import "server-only";

/** Local-only shortcut: email+password `1` → oemegil account. Never in production. */
export const DEV_LOGIN_BYPASS_USERNAME = "oemegil";

export function isDevLoginBypass(email: string, password: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return email.trim() === "1" && password === "1";
}
