import { notFound } from "next/navigation";

import { TripSettingsForm } from "@/features/trips/components/trip-settings-form";
import { toTripDetailDto } from "@/features/trips/dto";
import { requireSessionUserId } from "@/lib/auth/session";
import { findOwnedTripById } from "@/server/repositories/trip-repository";

type PageProps = { params: Promise<{ tripId: string }> };

export const metadata = { title: "Gezi ayarları" };

export default async function TripSettingsPage({ params }: PageProps) {
  const ownerId = await requireSessionUserId();
  const { tripId } = await params;
  const trip = await findOwnedTripById(tripId, ownerId);
  if (!trip) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Gezi detayları</h1>
        <p className="text-muted-foreground text-body">
          Başlık, destinasyon ve tarihleri güncelleyin.
        </p>
      </div>
      <TripSettingsForm trip={toTripDetailDto(trip)} />
    </section>
  );
}
