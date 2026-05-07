import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/ui/AppNav";
import { getUser, getActiveCouple } from "@/lib/supabase/auth";

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

  // 還沒配對 → 邀請頁(允許 settings 進入做基本資料設定)
  const couple = await getActiveCouple(user.id);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24">{children}</main>
      {couple && <AppNav />}
    </div>
  );
}
