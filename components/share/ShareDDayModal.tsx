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
  const [working, setWorking] = useState<"none" | "share" | "download">("none");
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // 偵測 Web Share API with files 支援(iOS 16+ Safari、Android Chrome)
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    try {
      const dummyFile = new File([""], "x.png", { type: "image/png" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ok = (navigator as any).canShare?.({ files: [dummyFile] }) ?? false;
      setCanShareFiles(ok);
    } catch {
      setCanShareFiles(false);
    }
  }, []);

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

  async function renderToBlob(): Promise<Blob> {
    if (!cardRef.current) throw new Error("no card");
    if (backgroundUrl && !bgDataUrl) throw new Error("背景還在載");
    await waitForImagesLoaded(cardRef.current);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const dataUrl = await domToPng(cardRef.current, { scale: 3 });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function shareWithFile() {
    setWorking("share");
    try {
      const blob = await renderToBlob();
      const file = new File([blob], `howu-${days}-days.png`, { type: "image/png" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "howu",
          text: `${partnerAName} & ${partnerBName} · ${days} 天 ✨`,
        });
        toast("已開啟分享面板", { tone: "success" });
      } else {
        // fallback to download
        await downloadInternal(blob);
      }
    } catch (e) {
      // 用戶取消 share 不算錯
      const msg = (e as Error).message;
      if (!msg.includes("AbortError") && !msg.includes("cancel")) {
        toast(`分享失敗:${msg}`, { tone: "error" });
      }
    } finally {
      setWorking("none");
    }
  }

  async function downloadInternal(blob: Blob) {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `howu-${days}-days.png`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast("已下載", { tone: "success" });
  }

  async function downloadOnly() {
    setWorking("download");
    try {
      const blob = await renderToBlob();
      await downloadInternal(blob);
    } catch (e) {
      toast(`下載失敗:${(e as Error).message}`, { tone: "error" });
    } finally {
      setWorking("none");
    }
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
                {canShareFiles ? (
                  <>
                    <Button
                      onClick={shareWithFile}
                      loading={working === "share"}
                      disabled={bgLoading}
                      fullWidth
                      size="lg"
                    >
                      📤 分享圖片(到 IG / Threads / LINE / 相簿)
                    </Button>
                    <p className="text-[11px] text-zinc-400 text-center -mt-1">
                      點開系統分享面板,可以一鍵丟到任何 app
                    </p>
                    <Button
                      onClick={downloadOnly}
                      loading={working === "download"}
                      disabled={bgLoading}
                      variant="secondary"
                      fullWidth
                    >
                      📥 只下載
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={downloadOnly}
                      loading={working === "download"}
                      disabled={bgLoading}
                      fullWidth
                      size="lg"
                    >
                      📥 下載圖片
                    </Button>
                    <p className="text-[11px] text-zinc-400 text-center -mt-1">
                      下載後從相簿 / 下載項目找到再分享
                    </p>
                  </>
                )}

                <Button onClick={copyLink} variant="soft" fullWidth>
                  🔗 複製連結
                </Button>
              </div>

              {!canShareFiles && (
                <p className="text-[11px] text-zinc-400 text-center mt-4 leading-relaxed">
                  iPhone 用 Safari、Android 用 Chrome 開,
                  <br />
                  分享按鈕會多一個「直接送到 IG / LINE」的選項
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
