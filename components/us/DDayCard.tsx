"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ddayCount } from "@/lib/utils/date";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { ShareDDayModal } from "@/components/share/ShareDDayModal";

interface Props {
  coupleId: string;
  togetherSince: string;
  partnerName: string | null;
  myName: string | null;
  backgroundUrl: string | null;
}

export function DDayCard({
  coupleId,
  togetherSince,
  partnerName,
  myName,
  backgroundUrl,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(backgroundUrl);
  const [shareOpen, setShareOpen] = useState(false);

  const days = ddayCount(togetherSince);
  const bg = optimisticUrl ?? backgroundUrl;

  async function uploadBackground(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const photoId = crypto.randomUUID();
      const path = `${coupleId}/bg/${photoId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("shared_photos")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { data: signed } = await supabase.storage
        .from("shared_photos")
        .createSignedUrl(path, 60 * 60 * 24 * 30);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updErr } = await (supabase as any).rpc("set_couple_background", {
        p_couple_id: coupleId,
        p_path: path,
      });
      if (updErr) throw new Error(updErr.message);

      setOptimisticUrl(signed?.signedUrl ?? null);
      toast("背景已換", { tone: "success" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="relative rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-paper-line)]">
        <div className="absolute inset-0">
          {bg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--color-paper-dim)]" />
          )}
          {bg && <div className="absolute inset-0 bg-black/35" />}
        </div>

        <div className="relative px-6 py-12 flex flex-col items-center text-center">
          <p
            className={`text-[10px] uppercase tracking-[0.32em] mb-3 ${
              bg ? "text-white/85" : "text-[var(--color-ink-soft)]"
            }`}
          >
            In Love For
          </p>
          <div
            className={`font-serif text-7xl tabular-nums leading-none ${
              bg ? "text-white" : "text-[var(--color-ink)]"
            }`}
            style={{ textShadow: bg ? "0 2px 16px rgba(0,0,0,0.35)" : undefined }}
          >
            {days}
          </div>
          <p
            className={`text-xs mt-3 tracking-widest uppercase ${
              bg ? "text-white/85" : "text-[var(--color-ink-soft)]"
            }`}
          >
            Days
          </p>
          {(myName || partnerName) && (
            <p
              className={`text-sm mt-6 ${
                bg ? "text-white" : "text-[var(--color-ink)]"
              }`}
            >
              {myName ?? "你"} & {partnerName ?? "對方"}
            </p>
          )}
          <p
            className={`text-[11px] mt-1 ${
              bg ? "text-white/70" : "text-[var(--color-ink-soft)]"
            }`}
          >
            自 {togetherSince}
          </p>

          <div className="flex gap-2 mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadBackground(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`text-xs px-4 py-1.5 rounded-full transition disabled:opacity-50 ${
                bg
                  ? "bg-white/15 text-white border border-white/35 hover:bg-white/25 backdrop-blur"
                  : "bg-white text-[var(--color-ink)] border border-[var(--color-paper-line)] hover:border-[var(--color-ink-mid)]"
              }`}
            >
              {uploading ? "上傳中" : bg ? "換背景" : "加背景"}
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className={`text-xs px-4 py-1.5 rounded-full transition ${
                bg
                  ? "bg-white text-[var(--color-ink)] hover:bg-white/90"
                  : "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-mid)]"
              }`}
            >
              分享
            </button>
          </div>
        </div>
      </div>

      <ShareDDayModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        coupleId={coupleId}
        days={days}
        togetherSince={togetherSince}
        partnerAName={myName ?? "你"}
        partnerBName={partnerName ?? "對方"}
        backgroundUrl={bg}
      />
    </>
  );
}
