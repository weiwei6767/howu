"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";

export function InviteHub() {
  const t = useTranslations();
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState<"cute" | "simple" | "custom">("simple");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("invitations")
        .select("token, expires_at, message, message_style")
        .eq("inviter_id", u.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const inv = data as
        | { token: string; expires_at: string | null; message: string | null; message_style: string | null }
        | null;
      if (inv?.token) {
        setLink(buildLink(inv.token));
        setExpiresAt(inv.expires_at ?? null);
        if (inv.message) setMessage(inv.message);
        if (inv.message_style) setStyle(inv.message_style as "cute" | "simple" | "custom");
      }
    })();
  }, []);

  async function generate() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await callRpc(supabase, "create_invitation", {
        p_message: message || null,
        p_message_style: style,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("no data");
      setLink(buildLink(data.token));
      setExpiresAt(data.expires_at);
      toast(t("invite.copy_link"), { tone: "success" });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast(t("common.copied"), { tone: "success" });
  }

  async function share() {
    if (!link) return;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "howu", url: link, text: message || undefined });
      } catch {}
    } else {
      copy();
    }
  }

  const expiresInDays = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : 30;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("invite.title")}</h1>
        <p className="text-sm text-zinc-500">{t("invite.subtitle")}</p>
      </header>

      <Card className="flex flex-col gap-4">
        <label className="text-sm font-medium">{t("invite.your_message")}</label>
        <Textarea
          rows={3}
          placeholder={t("invite.message_placeholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500">{t("invite.message_style_label")}</span>
          <div className="flex gap-2">
            {(["cute", "simple", "custom"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`flex-1 py-2 text-sm rounded-[var(--radius-button)] border ${
                  style === s
                    ? "border-[var(--color-rose)] text-[var(--color-rose)] bg-[var(--color-rose-soft)]/40"
                    : "border-zinc-200 text-zinc-600"
                }`}
              >
                {t(`invite.message_style.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {!link ? (
          <Button onClick={generate} loading={loading} fullWidth size="lg">
            {t("invite.generate")}
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <p className="text-xs text-zinc-400">{t("invite.expires_in", { days: expiresInDays })}</p>
            <div className="flex gap-2">
              <Button onClick={share} fullWidth>
                {t("invite.share_link")}
              </Button>
              <Button onClick={copy} variant="secondary" fullWidth>
                {t("invite.copy_link")}
              </Button>
            </div>
            <button
              onClick={generate}
              className="text-xs text-zinc-400 underline self-end"
              disabled={loading}
            >
              {t("invite.regenerate")}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function buildLink(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pair/${token}`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://howu.online";
  return `${site}/pair/${token}`;
}
