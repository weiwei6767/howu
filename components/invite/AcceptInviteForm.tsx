"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";

interface Props {
  token: string;
  inviterName: string;
  inviterMessage: string | null;
}

const TYPES = ["cohabit", "same_city", "long_distance"] as const;

export function AcceptInviteForm({ token, inviterName, inviterMessage }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [together, setTogether] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<(typeof TYPES)[number]>("same_city");
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpc(supabase, "accept_invitation", {
        p_token: token,
        p_together_since: together,
        p_relationship_type: type,
      });
      if (error) {
        const code = (error.message ?? "").trim();
        const msgKey = code.includes("invitation_not_found_or_expired")
          ? "invite.expired"
          : code.includes("cannot_accept_own_invitation")
            ? "invite.self_accept"
            : null;
        toast(msgKey ? t(msgKey) : code, { tone: "error" });
        return;
      }
      toast(t("auth.pair_accept"), { tone: "success" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center flex flex-col gap-1">
        <div className="text-4xl" aria-hidden>💞</div>
        <h1 className="text-xl font-semibold">{t("invite.accept_title", { inviter: inviterName })}</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">{t("invite.accept_body")}</p>
      </header>

      {inviterMessage && (
        <blockquote className="rounded-[var(--radius-card)] bg-[var(--color-rose-soft)]/30 px-4 py-3 italic text-sm leading-relaxed">
          {inviterMessage}
        </blockquote>
      )}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">{t("invite.together_since_label")}</label>
        <Input
          type="date"
          value={together}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setTogether(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t("invite.relationship_type_label")}</label>
        <div className="flex flex-col gap-2">
          {TYPES.map((tt) => (
            <button
              key={tt}
              type="button"
              onClick={() => setType(tt)}
              className={`text-left px-4 py-3 rounded-[var(--radius-button)] border ${
                type === tt
                  ? "border-[var(--color-rose)] bg-[var(--color-rose-soft)]/40"
                  : "border-zinc-200"
              }`}
            >
              <span className="text-sm">{t(`invite.relationship_type.${tt}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={accept} loading={loading} fullWidth size="lg">
        {t("invite.accept_button")}
      </Button>
    </div>
  );
}
