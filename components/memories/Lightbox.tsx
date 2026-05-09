"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
}

export function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  useEffect(() => {
    if (index === null) return;
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
  }, [index, photos.length, onClose, onNavigate]);

  const open = index !== null;
  const photo = open ? photos[index!] : null;

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            key={photo.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={photo.url}
            alt={photo.caption ?? ""}
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

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
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 tabular-nums tracking-wide">
            {index! + 1} / {photos.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
