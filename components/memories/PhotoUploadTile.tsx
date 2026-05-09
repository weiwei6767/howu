"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coupleId: string;
}

export function PhotoUploadTile({ coupleId }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const photoId = crypto.randomUUID();
      const path = `${coupleId}/${photoId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("shared_photos")
        .upload(path, file, { cacheControl: "3600" });
      if (upErr) throw new Error(upErr.message);

      const { data: u } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("shared_photos").insert({
        couple_id: coupleId,
        uploader_id: u.user?.id ?? "",
        url: path,
        caption: null,
        taken_at: new Date().toISOString().slice(0, 10),
      });
      if (insErr) throw new Error(insErr.message);

      toast(t("memories.upload"), { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      aria-label={t("memories.upload")}
      className="relative aspect-square overflow-hidden bg-[var(--color-paper-dim)] border border-dashed border-[var(--color-paper-line)] hover:border-[var(--color-ink-mid)] transition-colors flex flex-col items-center justify-center gap-1 group disabled:opacity-60"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {uploading ? (
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-ink-mid)] border-t-transparent" />
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-7 h-7 text-[var(--color-ink-mid)] group-hover:text-[var(--color-ink)] transition-colors"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink-mid)]">
            {t("memories.upload")}
          </span>
        </>
      )}
    </button>
  );
}
