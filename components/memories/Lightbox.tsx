"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/store/toast";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface Props {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
  onCaptionUpdated?: (photoId: string, newCaption: string | null) => void;
}

export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
  onCaptionUpdated,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (index === null) return;
    setEditing(false);
    setDraft(photos[index]?.caption ?? "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      else if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos, onClose, onNavigate]);

  async function saveCaption() {
    if (index === null) return;
    const photo = photos[index];
    setSaving(true);
    try {
      const supabase = createClient();
      const trimmed = draft.trim();
      const value = trimmed.length > 0 ? trimmed : null;
      const { error } = await supabase
        .from("shared_photos")
        .update({ caption: value })
        .eq("id", photo.id);
      if (error) throw new Error(error.message);
      onCaptionUpdated?.(photo.id, value);
      setEditing(false);
      toast("已儲存", { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const open = index !== null;
  const photo = open ? photos[index!] : null;
  const currentCaption = (photo?.caption ?? "").trim();

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center"
          onClick={onClose}
        >
          {/* 圖 */}
          <motion.div
            key={photo.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full flex items-center justify-center px-4 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              className="max-w-full max-h-full object-contain select-none"
            />
          </motion.div>

          {/* 底部 caption 區 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl px-5 pb-8 pt-3 flex flex-col gap-2"
          >
            {editing ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  maxLength={200}
                  autoFocus
                  placeholder="這張照片想留下的話"
                  className="w-full rounded-md bg-white/10 border border-white/25 text-white text-sm px-3 py-2 leading-relaxed placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                  style={{
                    fontFamily: "var(--font-caveat), Georgia, serif",
                    fontSize: "1.05rem",
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/50 tabular-nums">
                    {draft.length} / 200
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDraft(currentCaption);
                      }}
                      disabled={saving}
                      className="px-3 h-9 rounded-md text-sm text-white/80 hover:text-white border border-white/20"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={saveCaption}
                      disabled={saving}
                      className="px-4 h-9 rounded-md text-sm bg-white text-[var(--color-ink)] disabled:opacity-50"
                    >
                      {saving ? "儲存中…" : "儲存"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraft(currentCaption);
                  setEditing(true);
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 transition-colors flex items-baseline gap-2"
              >
                {currentCaption ? (
                  <span
                    className="flex-1 text-white leading-relaxed"
                    style={{
                      fontFamily: "var(--font-caveat), Georgia, serif",
                      fontSize: "1.15rem",
                    }}
                  >
                    {currentCaption}
                  </span>
                ) : (
                  <span
                    className="flex-1 text-white/55 italic"
                    style={{
                      fontFamily: "var(--font-caveat), Georgia, serif",
                      fontSize: "1rem",
                    }}
                  >
                    為這張照片留下一點紀錄...
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider text-white/45">
                  ✏︎ 編輯
                </span>
              </button>
            )}
          </div>

          {/* 關閉 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-xl backdrop-blur hover:bg-white/25 active:scale-95 transition"
            aria-label="close"
          >
            ✕
          </button>

          {/* 上一張 */}
          {index! > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index! - 1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white text-xl backdrop-blur hover:bg-white/25 transition"
              aria-label="prev"
            >
              ‹
            </button>
          )}
          {/* 下一張 */}
          {index! < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index! + 1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white text-xl backdrop-blur hover:bg-white/25 transition"
              aria-label="next"
            >
              ›
            </button>
          )}

          {/* 計數 */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/60 tabular-nums tracking-wide">
            {index! + 1} / {photos.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
