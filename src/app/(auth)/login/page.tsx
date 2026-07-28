import { Suspense } from "react";

import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Giriş yap",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Tekrar hoş geldin"
      description="Planına, gezilerine ve Keşfet’e devam et."
    >
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
