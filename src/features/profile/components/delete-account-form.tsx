"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/v1/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirmation }),
    });

    const payload = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Hesap silinemedi.");
      return;
    }

    queryClient.clear();
    router.push("/register");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Alert variant="destructive">
        <AlertTitle>Bu işlem geri alınamaz</AlertTitle>
        <AlertDescription>
          Hesabınız devre dışı bırakılır ve kişisel profil alanları anonimleştirilir.
          Bu hesap üzerinden artık gezilere erişilemez.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmation">Onaylamak için DELETE yazın</Label>
        <Input
          id="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Silme başarısız</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" variant="destructive" className="w-full" disabled={pending}>
        {pending ? "Siliniyor…" : "Hesabı sil"}
      </Button>
    </form>
  );
}
