"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils/date";

interface Props {
  userId: string;
  partnerName: string | null;
  todayResponseId: string | null;
  initial: { id: string | null; content: string; share: boolean; attach: boolean };
}

export function JournalEditor({ userId, partnerName, todayResponseId, initial }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [content, setContent] = useState(initial.content);
  const [share, setShare] = useState(initial.share);
  const [attach, setAttach] = useState(initial.attach);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const date = todayISO();
      const payload = {
        user_id: userId,
        date,
        content: content.trim(),
        attached_response_id: attach ? todayResponseId : null,
        shared_with_partner: share,
      };
      const op = initial.id
        ? supabase.from("journal_entries").update(payload).eq("id", initial.id)
        : supabase.from("journal_entries").insert(payload);
      const { error } = await op;
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function aiPrompt() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/journal-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_name: partnerName ?? "對方" }),
      });
      const json = await res.json();
      if (json.template) {
        const newContent = content.trim() ? `${content.trim()}\n\n${json.template}` : json.template;
        setContent(newContent);
      }
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("journal.today")}</h2>
        <button
          type="button"
          onClick={aiPrompt}
          disabled={aiLoading}
          className="text-xs text-[var(--color-rose)] underline disabled:opacity-50"
        >
          {aiLoading ? "AI 起頭中..." : "✨ AI 幫我起頭"}
        </button>
      </div>
      <Textarea
        rows={6}
        placeholder={t("journal.compose_placeholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span>{t("journal.share_with_partner")}</span>
      </label>
      {todayResponseId && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
          <span>{t("journal.attach_response")}</span>
        </label>
      )}
      <Button onClick={save} loading={saving} disabled={!content.trim()}>
        {t("common.save")}
      </Button>
    </Card>
  );
}
