import { TripPlanWizard } from "@/features/plan/components/trip-plan-wizard";

export const metadata = {
  title: "Seyahat",
  description: "Bilet kontrol et, gezi planla veya eski gezini kaydet.",
};

export default function PlanPage() {
  return <TripPlanWizard />;
}
