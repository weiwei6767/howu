"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils/date";

interface PhotoEntry {
  path: string;
  signedUrl: string;
}

interface Props {
  userId: string;
  partnerName: string | null;
  todayResponseId: string | null;
  initial: {
    id: string | null;
    content: string;
    share: boolean;
    attach: boolean;
    photos: PhotoEntry[];
  };
}

export function JournalEditor({ userId, partnerName, todayResponseId, initial }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entryId, setEntryId] = useState<string | null>(initial.id);
  const [content, setContent] = useState(initial.content);
  const [share, setShare] = useState(initial.share);
  const [attach, setAttach] = useState(initial.attach);
  const [photos, setPhotos] = useState<PhotoEntry[]>(initial.photos);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function ensureEntry(): Promise<string> {
    if (entryId) return entryId;
    const supabase = createClient();
    const date = todayISO();
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: userId, date, content: content.trim() || "" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "create_failed");
    setEntryId(data.id);
    return data.id;
  }

  async function uploadPhotos(files: FileList) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const eid = await ensureEntry();
      const uploaded: PhotoEntry[] = [];
      for (const f of Array.from(files)) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        const path = `${userId}/${eid}/${photoId}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("journal_photos")
          .upload(path, f);
        if (upErr) {
          toast(`${f.name}: ${upErr.message}`, { tone: "error" });
          continue;
        }
        const { data: signed } = await supabase.storage
          .from("journal_photos")
          .createSignedUrl(path, 60 * 60 * 6);
        uploaded.push({ path, signedUrl: signed?.signedUrl ?? "" });
      }
      const next = [...photos, ...uploaded];
      setPhotos(next);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("journal_entries")
        .update({ photos: next.map((p) => ({ path: p.path })) })
        .eq("id", eid);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto(path: string) {
    setUploading(true);
    try {
      const supabase = createClient();
      await supabase.storage.from("journal_photos").remove([path]);
      const next = photos.filter((p) => p.path !== path);
      setPhotos(next);
      if (entryId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("journal_entries")
          .update({ photos: next.map((p) => ({ path: p.path })) })
          .eq("id", entryId);
      }
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!content.trim() && photos.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const eid = await ensureEntry();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("journal_entries")
        .update({
          content: content.trim(),
          attached_response_id: attach ? todayResponseId : null,
          shared_with_partner: share,
          photos: photos.map((p) => ({ path: p.path })),
        })
        .eq("id", eid);
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
        const next = content.trim() ? `${content.trim()}\n\n${json.template}` : json.template;
        setContent(next);
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

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div
              key={p.path}
              className="relative aspect-square rounded-md overflow-hidden bg-zinc-100 group"
            >
              {p.signedUrl && (
                <Image
                  src={p.signedUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.path)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) uploadPhotos(e.target.files);
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-[var(--color-rose)] hover:underline disabled:opacity-50"
        >
          {uploading ? "上傳中..." : "📷 加照片"}
        </button>
      </div>

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

      <Button
        onClick={save}
        loading={saving}
        disabled={!content.trim() && photos.length === 0}
      >
        {t("common.save")}
      </Button>
    </Card>
  );
}
