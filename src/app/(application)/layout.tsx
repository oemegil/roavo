import { redirect } from "next/navigation";

import { AppBottomNav, AppTopBar } from "@/components/shared/app-shell";
import { auth } from "@/lib/auth/auth";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  return (
    <div className="bg-background flex min-h-full flex-1 flex-col">
      <AppTopBar displayName={session.user.displayName || "Traveler"} />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {children}
      </div>
      <AppBottomNav />
    </div>
  );
}
