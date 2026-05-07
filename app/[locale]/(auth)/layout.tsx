import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col flex-1 min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
