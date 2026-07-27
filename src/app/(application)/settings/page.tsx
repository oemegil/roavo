import Link from "next/link";

import { LogoutButton } from "@/components/shared/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Ayarlar",
};

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading">Ayarlar</h1>
        <p className="text-muted-foreground text-body">
          Profilinizi ve hesabınızı yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Kullanıcı adı, biyografi ve seyahat tercihleri.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/settings/profile">Profili düzenle</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hesap</CardTitle>
          <CardDescription>Çıkış yapın veya hesabınızı kalıcı olarak silin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <LogoutButton />
          <Button asChild variant="destructive" className="w-full">
            <Link href="/settings/account">Hesabı sil</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
