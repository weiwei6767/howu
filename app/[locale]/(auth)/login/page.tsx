import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getUser } from "@/lib/supabase/auth";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const sp = await searchParams;

  const user = await getUser();
  if (user) redirect("/");

  const errorRaw = sp.error_description ?? sp.error;
  const errorMsg = errorRaw ? decodeURIComponent(errorRaw) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center flex flex-col gap-2 pt-4">
        <h1 className="font-serif text-5xl tracking-tight">howu</h1>
        <p className="text-sm text-[var(--color-ink-mid)]">{t("brand.tagline")}</p>
      </header>
      {errorMsg && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-danger)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
          <p className="font-medium">登入失敗</p>
          <p className="text-xs mt-1 break-all">{errorMsg}</p>
          <p className="text-xs mt-2">連結可能過期或已使用過,請重新寄送一次登入連結。</p>
        </div>
      )}
      <LoginForm />
    </div>
  );
}
