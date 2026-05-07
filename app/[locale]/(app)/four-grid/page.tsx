import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/date";
import { todayTheme } from "@/lib/four-grid/themes";
import { getProfile } from "@/lib/supabase/queries";
import { FourGridChooser } from "@/components/four_grid/FourGridChooser";

export default async function FourGridPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);

  const date = todayISO();
  const theme = todayTheme(couple.id, date);
  const partnerId = couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id;

  const supabase = await createSupabaseServerClient();
  const [{ data: mineRaw }, { data: partnerRaw }, profile] = await Promise.all([
    supabase
      .from("four_grid_responses")
      .select("selected_index")
      .eq("couple_id", couple.id)
      .eq("responder_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    partnerId
      ? supabase
          .from("four_grid_responses")
          .select("selected_index")
          .eq("couple_id", couple.id)
          .eq("responder_id", partnerId)
          .eq("date", date)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getProfile(user.id),
  ]);
  const mine = mineRaw as { selected_index: number | null } | null;
  const partner = partnerRaw as { selected_index: number | null } | null;

  return (
    <FourGridChooser
      coupleId={couple.id}
      userId={user.id}
      date={date}
      theme={theme}
      myPick={mine?.selected_index ?? null}
      partnerPick={partner?.selected_index ?? null}
      locale={profile?.locale ?? locale}
    />
  );
}
