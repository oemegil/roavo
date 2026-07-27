const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "password123",
  "password1234",
  "1234567890",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "admin12345",
  "iloveyou12",
]);

export type PasswordPolicyResult = { ok: true } | { ok: false; message: string };

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (typeof password !== "string") {
    return { ok: false, message: "Şifre gerekli." };
  }

  if (password.length === 0 || password.trim().length === 0) {
    return { ok: false, message: "Şifre boş olamaz." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Şifre en fazla ${MAX_PASSWORD_LENGTH} karakter olabilir.`,
    };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: "Daha az yaygın bir şifre seç." };
  }

  return { ok: true };
}

export const PASSWORD_POLICY_HINT = `En az ${MIN_PASSWORD_LENGTH} karakter. Boşluk ve özel karakter kullanılabilir.`;
