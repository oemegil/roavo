"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PASSWORD_POLICY_HINT, registerSchema } from "@/features/auth/schemas";

const formSchema = z
  .object({
    email: z.email("Geçerli bir e-posta adresi gir."),
    username: z.string().min(1, "Kullanıcı adı gerekli."),
    displayName: z.string().trim().min(1, "Görünen ad gerekli.").max(80),
    password: z.string().min(1, "Şifre gerekli."),
    passwordConfirmation: z.string().min(1, "Şifreni onayla."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirmation"],
  });

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Bilgilerini kontrol edip tekrar dene.");
      return;
    }

    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setFormError(
        payload?.error?.message ?? "Hesap oluşturulamadı. Lütfen tekrar dene.",
      );
      return;
    }

    queryClient.removeQueries({ queryKey: ["current-user"] });
    router.push("/plan");
    router.refresh();
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-destructive text-sm" role="alert">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Kullanıcı adı</Label>
        <Input
          id="username"
          autoComplete="username"
          {...form.register("username")}
        />
        {form.formState.errors.username ? (
          <p className="text-destructive text-sm" role="alert">
            {form.formState.errors.username.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Görünen ad</Label>
        <Input
          id="displayName"
          autoComplete="name"
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName ? (
          <p className="text-destructive text-sm" role="alert">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-12"
            {...form.register("password")}
          />
          <button
            type="button"
            className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
            onClick={() => setShowPassword((value) => !value)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-caption">{PASSWORD_POLICY_HINT}</p>
        {form.formState.errors.password ? (
          <p className="text-destructive text-sm" role="alert">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">Şifre tekrar</Label>
        <Input
          id="passwordConfirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          {...form.register("passwordConfirmation")}
        />
        {form.formState.errors.passwordConfirmation ? (
          <p className="text-destructive text-sm" role="alert">
            {form.formState.errors.passwordConfirmation.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Kayıt başarısız</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Zaten hesabın var mı?{" "}
        <Link
          href="/login"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
