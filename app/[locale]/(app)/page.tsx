import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireUser, getActiveCouple } from "@/lib/supabase/auth";
import { InviteHub } from "@/components/invite/InviteHub";
import { PausedScreen } from "@/components/screens/PausedScreen";
import { TodayScreen } from "@/components/today/TodayScreen";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);

  if (!couple) {
    return <InviteHub />;
  }
  if (couple.status === "paused") {
    return <PausedScreen />;
  }
  if (couple.status === "recovery") {
    // 解除綁定後唯一可見的就是回憶冊
    redirect("/memories/book");
  }

  return <TodayScreen user={user} couple={couple} />;
}
