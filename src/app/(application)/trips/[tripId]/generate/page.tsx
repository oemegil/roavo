import { notFound } from "next/navigation";

import { GenerateItineraryClient } from "@/features/ai/components/generate-itinerary-client";
import { requireSessionUserId } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { getTripService } from "@/server/application/trips/get-trip";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ tripId: string }> };

export default async function GenerateItineraryPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireSessionUserId();
  let trip;
  try {
    trip = await getTripService({ ownerId: userId, tripId });
  } catch (error) {
    if (isAppError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }
  return <GenerateItineraryClient trip={trip} />;
}
