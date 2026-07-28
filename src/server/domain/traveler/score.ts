import "server-only";

import type { TravelerScoreAction } from "@prisma/client";

/** 1.0 point = 10 minor units (supports 0.5 awards). */
export const SCORE_MINOR_PER_POINT = 10;

export const TRAVELER_SCORE_AMOUNTS_MINOR: Record<TravelerScoreAction, number> = {
  FLIGHT_SEARCH: 5, // +0.5
  PLAN_PREVIEW: 10, // +1
  TRIP_SAVE: 20, // +2
  TRIP_LIKE_RECEIVED: 10, // +1
  PHOTO_VERIFICATION: 30, // +3 reserved
};

export function pointsFromMinor(minor: number): number {
  return Math.round((minor / SCORE_MINOR_PER_POINT) * 10) / 10;
}

export function minorFromPoints(points: number): number {
  return Math.round(points * SCORE_MINOR_PER_POINT);
}

export type TravelerBadge = {
  id: string;
  label: string;
  description: string;
  minScore: number;
};

export const TRAVELER_BADGES: TravelerBadge[] = [
  {
    id: "newcomer",
    label: "Yeni gezgin",
    description: "Roavo’da yolculuğa başladın.",
    minScore: 0,
  },
  {
    id: "curious",
    label: "Meraklı",
    description: "Planlar ve aramalarla ısındın.",
    minScore: 10,
  },
  {
    id: "explorer",
    label: "Keşifçi",
    description: "Gezgin puanın 50’yi geçti.",
    minScore: 50,
  },
  {
    id: "trailblazer",
    label: "İz bırakan",
    description: "Gezgin puanın 100’e ulaştı.",
    minScore: 100,
  },
];

export function badgesForScore(scorePoints: number): TravelerBadge[] {
  return TRAVELER_BADGES.filter((badge) => scorePoints >= badge.minScore);
}

export function primaryBadgeForScore(scorePoints: number): TravelerBadge {
  const earned = badgesForScore(scorePoints);
  return earned[earned.length - 1] ?? TRAVELER_BADGES[0]!;
}

/** Explore ranking: favor owner score + trip likes. */
export function exploreRankScore(input: {
  travelerScoreMinor: number;
  likeCount: number;
}): number {
  return input.travelerScoreMinor + input.likeCount * 20;
}
