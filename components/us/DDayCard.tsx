"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
      <motion.div
        className="relative rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0">
          {bg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 via-amber-50 to-cream" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/35" />
        </div>

        <div className="relative px-6 py-10 flex flex-col items-center text-center">
          <p className={`text-xs tracking-widest mb-2 ${bg ? "text-white/90" : "text-zinc-500"}`}>
            IN LOVE FOR
          </p>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-7xl font-bold tabular-nums leading-none ${
              bg ? "text-white drop-shadow-lg" : "text-[var(--color-rose)]"
            }`}
            style={{ textShadow: bg ? "0 2px 16px rgba(0,0,0,0.3)" : undefined }}
          >
            {days}
          </motion.div>
          <p className={`text-sm mt-2 ${bg ? "text-white/90" : "text-zinc-500"}`}>天</p>
          {(myName || partnerName) && (
            <p className={`text-base mt-4 font-medium ${bg ? "text-white" : "text-zinc-700"}`}>
              {myName ?? "你"}{" "}
              <span className={bg ? "text-rose-200" : "text-[var(--color-rose)]"}>&</span>{" "}
              {partnerName ?? "對方"}
            </p>
          )}
          <p className={`text-[11px] mt-1 ${bg ? "text-white/70" : "text-zinc-400"}`}>
            自 {togetherSince}
          </p>

          <div className="flex gap-2 mt-5">
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
              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition disabled:opacity-50 ${
                bg
                  ? "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {uploading ? "上傳中..." : bg ? "🎨 換背景" : "🎨 加背景"}
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md transition ${
                bg
                  ? "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                  : "bg-[var(--color-rose)] text-white border border-[var(--color-rose)] hover:opacity-90"
              }`}
            >
              ↗ 分享
            </button>
          </div>
        </div>
      </motion.div>

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
