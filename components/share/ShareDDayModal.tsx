"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { DDayShareCard } from "./DDayShareCard";

interface Props {
  open: boolean;
  onClose: () => void;
  coupleId: string;
  days: number;
  togetherSince: string;
  partnerAName: string;
  partnerBName: string;
  /** same-origin URL(/api/img-proxy?...),避免 canvas taint */
  backgroundUrl: string | null;
}

export function ShareDDayModal({
  open,
  onClose,
  coupleId,
  days,
  togetherSince,
  partnerAName,
  partnerBName,
  backgroundUrl,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/dday/${coupleId}`
      : `https://howu.online/share/dday/${coupleId}`;
  const shareText = `${partnerAName} & ${partnerBName} · 在一起 ${days} 天 ✨ howu`;

  async function waitForImagesLoaded(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };
          img.addEventListener("load", done);
          img.addEventListener("error", done);
          // 安全網:5 秒後一定 release
          setTimeout(done, 5000);
        });
      }),
    );
  }

  async function downloadImage() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // 先等 background image 真的 load 完成,否則 toPng 會 capture 到黑色
      await waitForImagesLoaded(cardRef.current);
      // 多一輪 raf 讓 layout 穩定
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      // 跑兩次:第一次有時 image 還沒進 cache 會黑,第二次穩
      await toPng(cardRef.current, { cacheBust: false, pixelRatio: 1 });
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: false,
        pixelRatio: 3,
      });
      const link = document.createElement("a");
      link.download = `howu-${days}-days.png`;
      link.href = dataUrl;
      link.click();
      toast("已下載", { tone: "success" });
    } catch (e) {
      toast(`下載失敗:${(e as Error).message}`, { tone: "error" });
    } finally {
      setDownloading(false);
    }
  }

  function shareToThreads() {
    const intent = `https://www.threads.net/intent/post?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`,
    )}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  function shareToLine() {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      shareUrl,
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("連結已複製", { tone: "success" });
    } catch {
      toast(shareUrl, { tone: "info", duration: 6000 });
    }
  }

  async function nativeShare() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share({
          title: "howu",
          text: shareText,
          url: shareUrl,
        });
      } catch {}
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            <header className="px-6 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">分享你們的天數</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500"
              >
                ✕
              </button>
            </header>

            <div className="px-6 pb-5 overflow-y-auto flex-1">
              <div className="max-w-[260px] mx-auto mb-4">
                <DDayShareCard
                  ref={cardRef}
                  days={days}
                  togetherSince={togetherSince}
                  partnerAName={partnerAName}
                  partnerBName={partnerBName}
                  backgroundUrl={backgroundUrl}
                  scale="preview"
                />
              </div>
              <p className="text-xs text-zinc-500 text-center mb-4">
                這就是分享出去長的樣子
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={downloadImage}
                  loading={downloading}
                  fullWidth
                  size="lg"
                >
                  📥 下載圖片(存到相簿)
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={shareToThreads} variant="secondary" fullWidth>
                    🧵 Threads
                  </Button>
                  <Button onClick={shareToLine} variant="secondary" fullWidth>
                    💬 LINE
                  </Button>
                </div>

                <Button onClick={copyLink} variant="soft" fullWidth>
                  🔗 複製連結
                </Button>

                <button
                  onClick={nativeShare}
                  className="text-xs text-zinc-400 hover:text-[var(--color-rose)] mt-1"
                >
                  其他應用程式…
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 text-center mt-4 leading-relaxed">
                IG 限時動態:下載後從相簿拉到 Story
                <br />
                Threads / LINE 連結:對方點開會看到完整大卡
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
