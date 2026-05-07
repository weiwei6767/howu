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
    <div className="flex flex-col gap-7">
      <header className="text-center flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-rose)]">howu</h1>
        <p className="text-sm text-zinc-500">{t("brand.tagline")}</p>
      </header>
      {errorMsg && (
        <div className="rounded-[var(--radius-card)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">登入失敗</p>
          <p className="text-xs mt-1 break-all">{errorMsg}</p>
          <p className="text-xs mt-2 text-red-600">
            連結可能過期或已使用過,請重新寄送一次登入連結。
          </p>
        </div>
      )}
      <LoginForm />
    </div>
  );
}
