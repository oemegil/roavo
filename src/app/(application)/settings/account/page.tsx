import { DeleteAccountForm } from "@/features/profile/components/delete-account-form";

export const metadata = {
  title: "Hesabı sil",
};

export default function DeleteAccountPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Hesabı sil</h1>
        <p className="text-muted-foreground text-body">
          Bu hesabı kalıcı olarak devre dışı bırakmak için şifrenizi onaylayın.
        </p>
      </div>
      <DeleteAccountForm />
    </section>
  );
}
