import { setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/ui/AppNav";
import type { Locale } from "@/i18n/routing";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24">{children}</main>
      <AppNav />
    </div>
  );
}
