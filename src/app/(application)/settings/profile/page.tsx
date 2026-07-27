import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";

export const metadata = {
  title: "Profili düzenle",
};

export default function EditProfilePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Profili düzenle</h1>
        <p className="text-muted-foreground text-body">
          Roavo'da nasıl göründüğünüzü güncelleyin.
        </p>
      </div>
      <ProfileEditForm />
    </section>
  );
}
