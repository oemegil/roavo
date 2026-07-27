import { notFound } from "next/navigation";

import { TripEditor } from "@/features/trips/components/trip-editor";
import { requireSessionUserId } from "@/lib/auth/session";
import { findOwnedTripById } from "@/server/repositories/trip-repository";
import { toTripDetailDto } from "@/features/trips/dto";

type PageProps = {
  params: Promise<{ tripId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const ownerId = await requireSessionUserId();
  const { tripId } = await params;
  const trip = await findOwnedTripById(tripId, ownerId);
  return { title: trip?.title ?? "Gezi" };
}

export default async function TripDetailPage({ params }: PageProps) {
  const ownerId = await requireSessionUserId();
  const { tripId } = await params;
  const trip = await findOwnedTripById(tripId, ownerId);
  if (!trip) {
    notFound();
  }
  return <TripEditor initialTrip={toTripDetailDto(trip)} />;
}
