import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getUser } from "@/lib/supabase/auth";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await getUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-7">
      <header className="text-center flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-rose)]">howu</h1>
        <p className="text-sm text-zinc-500">{t("brand.tagline")}</p>
      </header>
      <LoginForm />
    </div>
  );
}
