import { Suspense } from "react";

import { TripPlanWizard } from "@/features/plan/components/trip-plan-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Planla",
  description: "Let's Roavo this trip. Gezini planla, yaşa, paylaş.",
};

function PlanWizardFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<PlanWizardFallback />}>
      <TripPlanWizard />
    </Suspense>
  );
}
