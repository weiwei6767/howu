"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { domToPng } from "modern-screenshot";
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
  backgroundUrl: string | null;
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);

  useEffect(() => {
    if (!open || !backgroundUrl) {
      setBgDataUrl(null);
      return;
    }
    let cancelled = false;
    setBgLoading(true);
    urlToDataUrl(backgroundUrl)
      .then((d) => {
        if (!cancelled) setBgDataUrl(d);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setBgDataUrl(null);
      })
      .finally(() => {
        if (!cancelled) setBgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, backgroundUrl]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/dday/${coupleId}`
      : `https://howu.online/share/dday/${coupleId}`;

  const shareText = `${partnerAName} & ${partnerBName} · ${days} 天 ✨`;

  async function waitForImagesLoaded(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        if (!(img.complete && img.naturalWidth > 0)) {
          await new Promise<void>((resolve) => {
            const done = () => {
              img.removeEventListener("load", done);
              img.removeEventListener("error", done);
              resolve();
            };
            img.addEventListener("load", done);
            img.addEventListener("error", done);
            setTimeout(done, 5000);
          });
        }
        if (typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {}
        }
      }),
    );
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    if (backgroundUrl && !bgDataUrl) {
      toast("背景還在載,稍等一下", { tone: "info" });
      return;
    }
    setDownloading(true);
    try {
      await waitForImagesLoaded(cardRef.current);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const dataUrl = await domToPng(cardRef.current, { scale: 3 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `howu-${days}-days.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast("已下載", { tone: "success" });
    } catch (e) {
      toast(`下載失敗:${(e as Error).message}`, { tone: "error" });
    } finally {
      setDownloading(false);
    }
  }

  function shareToThreads() {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://www.threads.net/intent/post?text=${text}`, "_blank");
  }

  function shareToLine() {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`,
      "_blank",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("連結已複製", { tone: "success" });
    } catch {
      toast(shareUrl, { tone: "info", duration: 6000 });
    }
  }

  const cardBg = bgDataUrl ?? null;

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
                  backgroundUrl={cardBg}
                  scale="preview"
                />
              </div>
              <p className="text-xs text-zinc-500 text-center mb-4">
                {bgLoading ? "背景載入中..." : "這就是分享出去長的樣子"}
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownload}
                  loading={downloading}
                  disabled={bgLoading}
                  fullWidth
                  size="lg"
                >
                  📥 下載 PNG
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
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
