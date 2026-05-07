import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { AcceptInviteForm } from "@/components/invite/AcceptInviteForm";

interface InvitationLite {
  inviter_id: string | null;
  message: string | null;
  status: string | null;
  expires_at: string | null;
}

export default async function PairPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/pair/${token}`)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: invRaw } = await supabase
    .from("invitations")
    .select("inviter_id, message, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  const inv = invRaw as InvitationLite | null;

  if (!inv || inv.status !== "pending" || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
    return (
      <div className="text-center flex flex-col gap-3">
        <div className="text-4xl" aria-hidden>⌛</div>
        <p className="text-sm text-zinc-500">{t("invite.expired")}</p>
      </div>
    );
  }

  if (inv.inviter_id === user.id) {
    return (
      <div className="text-center flex flex-col gap-3">
        <p className="text-sm text-zinc-500">{t("invite.self_accept")}</p>
      </div>
    );
  }

  const { data: inviterRaw } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", inv.inviter_id ?? "")
    .maybeSingle();
  const inviterName = (inviterRaw as { display_name: string } | null)?.display_name ?? "對方";

  return (
    <AcceptInviteForm
      token={token}
      inviterName={inviterName}
      inviterMessage={inv.message}
    />
  );
}
