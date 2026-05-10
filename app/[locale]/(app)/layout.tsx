import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/ui/AppNav";
import { getUser, getActiveCouple } from "@/lib/supabase/auth";
import { OnboardingSheet } from "@/components/pwa/OnboardingSheet";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  if (!user) redirect("/login");

  const couple = await getActiveCouple(user.id);
  const showNav = !!couple && couple.status === "active";

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24">{children}</main>
      {showNav && <AppNav />}
      {showNav && <OnboardingSheet />}
    </div>
  );
}
