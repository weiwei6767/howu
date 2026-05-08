"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

interface Props {
  photos: Photo[];
  occasionName: string;
  occasionEmoji: string;
  myName: string;
  partnerName: string;
  /** 自動播放間隔 ms */
  intervalMs?: number;
}

// 拍立得隨機 rotation 用穩定 hash(每張照片有自己的固定角度,不會 re-render 跳動)
function rotationOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 11) - 5) * 0.7; // -3.5 ~ 3.5 度
}

export function PolaroidSlideshow({
  photos,
  occasionName,
  occasionEmoji,
  myName,
  partnerName,
  intervalMs = 3500,
}: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showHelp, setShowHelp] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(1, photos.length));
  }, [photos.length]);
  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % Math.max(1, photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [playing, intervalMs, next, photos.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowHelp(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // 鍵盤
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  function toggleMusic() {
    if (!audioRef.current) return;
    if (musicOn) {
      audioRef.current.pause();
      setMusicOn(false);
    } else {
      audioRef.current.play().catch(() => {});
      setMusicOn(true);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-3">🎞️</div>
        <p className="text-base font-medium">還沒有照片可以放</p>
        <p className="text-sm text-zinc-500 mt-2">
          先去 /memories 上傳一些共同回憶
        </p>
      </div>
    );
  }

  const current = photos[index];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-amber-50 to-violet-100 overflow-hidden flex flex-col">
      {/* 背景光暈 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/50 rounded-full blur-3xl" />
      </div>

      {/* 頂部資訊 */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3 text-zinc-700">
        <div className="flex flex-col">
          <span className="text-xl">{occasionEmoji}</span>
          <span className="text-xs font-medium tracking-wide">{occasionName}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium">{myName} & {partnerName}</span>
          <span className="text-[10px] text-zinc-500">
            {index + 1} / {photos.length}
          </span>
        </div>
      </header>

      {/* 拍立得本體 */}
      <div className="relative flex-1 flex items-center justify-center px-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: -200, opacity: 0, scale: 0.9, rotate: -8 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: rotationOf(current.id),
            }}
            exit={{ y: 200, opacity: 0, scale: 0.95, rotate: rotationOf(current.id) + 5 }}
            transition={{ type: "spring", stiffness: 120, damping: 18, duration: 0.6 }}
            className="bg-white shadow-2xl"
            style={{
              padding: "16px 16px 60px",
              maxWidth: "min(85vw, 360px)",
              width: "100%",
            }}
          >
            <div
              className="relative w-full bg-zinc-100 overflow-hidden"
              style={{ aspectRatio: "1 / 1" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="text-center mt-3 px-2">
              <p
                className="text-base text-zinc-700 leading-snug"
                style={{ fontFamily: "var(--font-handwritten)" }}
              >
                {current.caption || formatPolaroidDate(current.taken_at)}
              </p>
              {current.caption && current.taken_at && (
                <p
                  className="text-xs text-zinc-400 mt-0.5"
                  style={{ fontFamily: "var(--font-handwritten)" }}
                >
                  {formatPolaroidDate(current.taken_at)}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 之前的卡片(疊在底下,堆疊感) */}
        {photos.length > 1 && (
          <div
            aria-hidden
            className="absolute bg-white shadow-xl pointer-events-none"
            style={{
              padding: "16px 16px 60px",
              maxWidth: "min(85vw, 360px)",
              width: "100%",
              transform: `rotate(${rotationOf(photos[(index - 1 + photos.length) % photos.length].id) - 8}deg) translate(-12px, 8px)`,
              opacity: 0.4,
              zIndex: -1,
            }}
          >
            <div className="relative w-full bg-zinc-200" style={{ aspectRatio: "1 / 1" }} />
            <div className="h-6" />
          </div>
        )}
      </div>

      {/* 底部控制 */}
      <footer className="relative z-10 flex items-center justify-center gap-3 px-5 pb-7 pt-3">
        <button
          onClick={prev}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-white"
          aria-label="上一張"
        >
          ◀
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-14 h-14 rounded-full bg-[var(--color-rose)] text-white shadow-lg flex items-center justify-center hover:opacity-90"
          aria-label={playing ? "暫停" : "播放"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={next}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-white"
          aria-label="下一張"
        >
          ▶
        </button>
        <button
          onClick={toggleMusic}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center hover:bg-white text-sm"
          aria-label="音樂"
        >
          {musicOn ? "🔊" : "🔇"}
        </button>
      </footer>

      {/* 提示 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-full text-xs"
          >
            手機螢幕錄影 → 存成回憶影片 ✨
          </motion.div>
        )}
      </AnimatePresence>

      {/* 背景音樂 — Pixabay 免版稅 */}
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/audio/2024/04/01/audio_71a3437d6f.mp3"
        preload="none"
      />
    </div>
  );
}

function formatPolaroidDate(taken_at: string | null): string {
  if (!taken_at) return "";
  const d = new Date(`${taken_at}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
