"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coupleId: string;
}

export function PhotoUpload({ coupleId }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const photoId = crypto.randomUUID();
      const path = `${coupleId}/${photoId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("shared_photos").upload(path, file, {
        cacheControl: "3600",
      });
      if (upErr) throw new Error(upErr.message);

      const { data: signed } = await supabase.storage
        .from("shared_photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const { error: insErr } = await supabase.from("shared_photos").insert({
        couple_id: coupleId,
        uploader_id: (await supabase.auth.getUser()).data.user?.id ?? "",
        url: path,
        caption: caption || null,
        taken_at: new Date().toISOString().slice(0, 10),
      });
      if (insErr) throw new Error(insErr.message);
      void signed;
      toast(t("settings.save_success"), { tone: "success" });
      setFile(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-5">
      <h2 className="text-sm text-[var(--color-ink-mid)]">上傳一張新照片</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-[var(--radius-button)] file:border file:border-[var(--color-paper-line)] file:bg-white file:text-[var(--color-ink)] file:cursor-pointer"
      />
      <Input
        placeholder={t("memories.caption_placeholder")}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <Button onClick={upload} disabled={!file} loading={uploading} className="self-start">
        {t("memories.upload")}
      </Button>
    </section>
  );
}
