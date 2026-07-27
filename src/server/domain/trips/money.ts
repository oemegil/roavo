import { ZERO_DECIMAL_CURRENCIES } from "./constants";

export function majorToMinor(amount: number, currencyCode: string): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative finite number.");
  }
  const factor = ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase()) ? 1 : 100;
  return Math.round(amount * factor);
}

export function minorToMajor(minor: number, currencyCode: string): number {
  const factor = ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase()) ? 1 : 100;
  return minor / factor;
}

export function formatMoneyMinor(minor: number, currencyCode: string): string {
  const major = minorToMajor(minor, currencyCode);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(major);
}
