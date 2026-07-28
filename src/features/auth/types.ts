import type { User, UserProfile, UserStatus } from "@prisma/client";

import type { TravelPreferences } from "@/features/auth/schemas";
import { travelPreferencesSchema } from "@/features/auth/schemas";

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  status: UserStatus;
  homeCountryCode: string | null;
  homeCity: string | null;
  preferredCurrency: string | null;
  preferredLanguage: string | null;
  travelPreferences: TravelPreferences;
  emailVerifiedAt: Date | null;
  travelerScore: number;
  travelerScoreMinor: number;
};

export function parseTravelPreferences(value: unknown): TravelPreferences {
  const parsed = travelPreferencesSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

export function toAuthenticatedUser(user: User, profile: UserProfile): AuthenticatedUser {
  const travelerScoreMinor = user.travelerScoreMinor ?? 0;
  return {
    id: user.id,
    email: user.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    status: user.status,
    homeCountryCode: profile.homeCountryCode,
    homeCity: profile.homeCity,
    preferredCurrency: profile.preferredCurrency,
    preferredLanguage: profile.preferredLanguage,
    travelPreferences: parseTravelPreferences(profile.travelPreferences),
    emailVerifiedAt: user.emailVerifiedAt,
    travelerScoreMinor,
    travelerScore: Math.round((travelerScoreMinor / 10) * 10) / 10,
  };
}

export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
