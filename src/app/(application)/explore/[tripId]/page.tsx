import { notFound } from "next/navigation";

import { PublicTripDetailClient } from "@/features/traveler/components/public-trip-detail";
import { requireSessionUserId } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getPublicTripDetail } from "@/server/application/traveler/explore";

export const metadata = {
  title: "Public gezi",
};

type PageProps = { params: Promise<{ tripId: string }> };

export default async function ExploreTripPage({ params }: PageProps) {
  const { tripId } = await params;
  const viewerId = await requireSessionUserId();

  let trip;
  try {
    trip = await getPublicTripDetail({ tripId, viewerId });
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <PublicTripDetailClient initialTrip={trip} isOwner={trip.owner.id === viewerId} />
  );
}
