import { TripsListClient } from "@/features/trips/components/trips-list";

export const metadata = {
  title: "Gezilerim",
};

export default function TripsPage() {
  return <TripsListClient initialStatus="DRAFT" />;
}
