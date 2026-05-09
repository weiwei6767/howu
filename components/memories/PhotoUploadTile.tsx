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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(files: FileList) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setProgress({ done: 0, total: arr.length });
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    const uploaderId = u.user?.id ?? "";

    let success = 0;
    let failed = 0;
    for (const [i, file] of arr.entries()) {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        const path = `${coupleId}/${photoId}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("shared_photos")
          .upload(path, file, { cacheControl: "3600" });
        if (upErr) throw new Error(upErr.message);
        const { error: insErr } = await supabase.from("shared_photos").insert({
          couple_id: coupleId,
          uploader_id: uploaderId,
          url: path,
          caption: null,
          taken_at: new Date().toISOString().slice(0, 10),
        });
        if (insErr) throw new Error(insErr.message);
        success += 1;
      } catch (e) {
        failed += 1;
        console.error(`upload ${file.name}:`, (e as Error).message);
      }
      setProgress({ done: i + 1, total: arr.length });
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";

    if (success > 0) {
      toast(
        failed > 0
          ? `${success} 張上傳成功 · ${failed} 張失敗`
          : `${success} 張已上傳`,
        { tone: failed > 0 ? "info" : "success" },
      );
      router.refresh();
    } else if (failed > 0) {
      toast(`上傳失敗`, { tone: "error" });
    }
  }

  const isUploading = progress !== null;
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={isUploading}
      aria-label={t("memories.upload")}
      className="relative aspect-[5/6] bg-white p-1.5 pb-7 shadow-[0_2px_8px_-3px_rgba(40,25,30,0.15)] hover:-rotate-1 hover:scale-[1.02] active:opacity-90 transition-all group disabled:opacity-100 flex flex-col"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />
      <div className="flex-1 bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-paper-dim)] border border-dashed border-[var(--color-accent)]/35 flex flex-col items-center justify-center gap-1">
        {isUploading ? (
          <>
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            <span className="text-[10px] tabular-nums text-[var(--color-ink-mid)] mt-1">
              {progress!.done} / {progress!.total}
            </span>
            <div className="absolute bottom-3 left-1.5 h-1 bg-[var(--color-accent)] transition-all" style={{ width: `calc(${pct}% - 0.75rem)` }} />
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-8 h-8 text-[var(--color-accent)]"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span
              className="text-sm text-[var(--color-accent-deep)]"
              style={{ fontFamily: "var(--font-caveat), Georgia, serif" }}
            >
              {t("memories.upload")}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
