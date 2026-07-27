import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Hesap oluştur",
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Roavo'ya katıl"
      description="Trip'lerini kaydetmek ve planlarını kişiselleştirmek için hesap oluştur."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
