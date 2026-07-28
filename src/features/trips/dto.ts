import type {
  ItineraryItem,
  Trip,
  TripDay,
  TripStatus,
  TravelPace,
} from "@prisma/client";

import { formatDateOnly } from "@/server/domain/trips/date-only";
import { minorToMajor } from "@/server/domain/trips/money";
import { minutesToHhMm } from "@/server/domain/trips/time-of-day";
import { detectScheduleOverlaps } from "@/server/domain/trips/time-of-day";

export type ItineraryItemDto = {
  id: string;
  tripDayId: string;
  type: string;
  title: string;
  description: string | null;
  locationName: string | null;
  externalPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  estimatedCostMinor: number | null;
  estimatedCostMajor: number | null;
  currencyCode: string | null;
  transportationMode: string | null;
  notes: string | null;
  position: number;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type TripDayDto = {
  id: string;
  tripId: string;
  date: string;
  title: string | null;
  notes: string | null;
  position: number;
  items: ItineraryItemDto[];
  scheduleWarnings: Array<{ a: string; b: string }>;
  createdAt: string;
  updatedAt: string;
};

export type TripSummaryDto = {
  id: string;
  title: string;
  destinationId: string | null;
  destinationName: string | null;
  destinationSource: string | null;
  originName: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  totalBudgetMinor: number | null;
  totalBudgetMajor: number | null;
  currencyCode: string;
  status: TripStatus;
  visibility: "PRIVATE" | "PUBLIC" | "FRIENDS";
  likeCount: number;
  commentCount: number;
  dayCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TripDetailDto = {
  id: string;
  title: string;
  description: string | null;
  status: TripStatus;
  visibility: "PRIVATE" | "PUBLIC" | "FRIENDS";
  likeCount: number;
  commentCount: number;
  originName: string;
  originCountryCode: string | null;
  originPlaceId: string | null;
  destinationId: string | null;
  destinationName: string | null;
  destinationCountryCode: string | null;
  destinationRegionName: string | null;
  destinationPlaceId: string | null;
  destinationSource: string | null;
  destinationSlug: string | null;
  startDate: string;
  endDate: string;
  travelerCount: number;
  totalBudgetMinor: number | null;
  totalBudgetMajor: number | null;
  currencyCode: string;
  travelPace: TravelPace;
  destinationTypes: string[];
  interests: string[];
  dietaryNotes: string | null;
  accessibilityNotes: string | null;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  days: TripDayDto[];
};

type TripWithCounts = Trip & {
  _count?: { days: number };
  days?: Array<{ id: string; _count?: { items: number }; items?: ItineraryItem[] }>;
};

export function toItineraryItemDto(item: ItineraryItem): ItineraryItemDto {
  return {
    id: item.id,
    tripDayId: item.tripDayId,
    type: item.type,
    title: item.title,
    description: item.description,
    locationName: item.locationName,
    externalPlaceId: item.externalPlaceId,
    latitude: item.latitude != null ? Number(item.latitude) : null,
    longitude: item.longitude != null ? Number(item.longitude) : null,
    startTime: item.startMinutes !== null ? minutesToHhMm(item.startMinutes) : null,
    endTime: item.endMinutes !== null ? minutesToHhMm(item.endMinutes) : null,
    durationMinutes: item.durationMinutes,
    estimatedCostMinor: item.estimatedCostMinor,
    estimatedCostMajor:
      item.estimatedCostMinor !== null && item.currencyCode
        ? minorToMajor(item.estimatedCostMinor, item.currencyCode)
        : item.estimatedCostMinor !== null
          ? item.estimatedCostMinor / 100
          : null,
    currencyCode: item.currencyCode,
    transportationMode: item.transportationMode,
    notes: item.notes,
    position: item.position,
    source: item.source,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toTripDayDto(day: TripDay & { items: ItineraryItem[] }): TripDayDto {
  const items = [...day.items]
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .map(toItineraryItemDto);

  const scheduled = day.items
    .filter((item) => item.startMinutes !== null && item.endMinutes !== null)
    .map((item) => ({
      id: item.id,
      startMinutes: item.startMinutes!,
      endMinutes: item.endMinutes!,
    }));

  return {
    id: day.id,
    tripId: day.tripId,
    date: formatDateOnly(day.date),
    title: day.title,
    notes: day.notes,
    position: day.position,
    items,
    scheduleWarnings: detectScheduleOverlaps(scheduled),
    createdAt: day.createdAt.toISOString(),
    updatedAt: day.updatedAt.toISOString(),
  };
}

export function toTripSummaryDto(trip: TripWithCounts): TripSummaryDto {
  const dayCount = trip._count?.days ?? trip.days?.length ?? 0;
  const itemCount =
    trip.days?.reduce(
      (sum, day) => sum + (day._count?.items ?? day.items?.length ?? 0),
      0,
    ) ?? 0;

  return {
    id: trip.id,
    title: trip.title,
    destinationId: trip.destinationId,
    destinationName: trip.destinationName,
    destinationSource: trip.destinationSource,
    originName: trip.originName,
    startDate: formatDateOnly(trip.startDate),
    endDate: formatDateOnly(trip.endDate),
    travelerCount: trip.travelerCount,
    totalBudgetMinor: trip.totalBudgetMinor,
    totalBudgetMajor:
      trip.totalBudgetMinor !== null
        ? minorToMajor(trip.totalBudgetMinor, trip.currencyCode)
        : null,
    currencyCode: trip.currencyCode,
    status: trip.status,
    visibility: trip.visibility,
    likeCount: trip.likeCount,
    commentCount: trip.commentCount,
    dayCount,
    itemCount,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

export function toTripDetailDto(
  trip: Trip & {
    days: Array<TripDay & { items: ItineraryItem[] }>;
    destination?: { slug: string } | null;
  },
): TripDetailDto {
  const days = [...trip.days]
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .map(toTripDayDto);

  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    status: trip.status,
    visibility: trip.visibility,
    likeCount: trip.likeCount,
    commentCount: trip.commentCount,
    originName: trip.originName,
    originCountryCode: trip.originCountryCode,
    originPlaceId: trip.originPlaceId,
    destinationId: trip.destinationId,
    destinationName: trip.destinationName,
    destinationCountryCode: trip.destinationCountryCode,
    destinationRegionName: trip.destinationRegionNameSnapshot,
    destinationPlaceId: trip.destinationPlaceId,
    destinationSource: trip.destinationSource,
    destinationSlug: trip.destination?.slug ?? null,
    startDate: formatDateOnly(trip.startDate),
    endDate: formatDateOnly(trip.endDate),
    travelerCount: trip.travelerCount,
    totalBudgetMinor: trip.totalBudgetMinor,
    totalBudgetMajor:
      trip.totalBudgetMinor !== null
        ? minorToMajor(trip.totalBudgetMinor, trip.currencyCode)
        : null,
    currencyCode: trip.currencyCode,
    travelPace: trip.travelPace,
    destinationTypes: trip.destinationTypes,
    interests: trip.interests,
    dietaryNotes: trip.dietaryNotes,
    accessibilityNotes: trip.accessibilityNotes,
    additionalNotes: trip.additionalNotes,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    archivedAt: trip.archivedAt?.toISOString() ?? null,
    days,
  };
}
