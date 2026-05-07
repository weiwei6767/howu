"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  level: number;
  totalScore: number;
}

const NEXT_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4200];

export function SyncTree({ level, totalScore }: Props) {
  const t = useTranslations();
  const lv = Math.max(1, Math.min(8, level));
  const trunkHeight = 18 + lv * 15;
  const canopy = lv >= 2 ? 16 + lv * 10 : 0;
  const nextThreshold = NEXT_THRESHOLDS[Math.min(8, lv)];
  const prevThreshold = NEXT_THRESHOLDS[lv - 1];
  const remain = Math.max(0, nextThreshold - totalScore);
  const progress =
    lv >= 8
      ? 1
      : Math.min(1, Math.max(0, (totalScore - prevThreshold) / (nextThreshold - prevThreshold)));

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.svg
        viewBox="0 0 200 240"
        className="w-44 h-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <defs>
          <radialGradient id="canopy" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd5db" />
            <stop offset="100%" stopColor="#c2185b" stopOpacity="0.45" />
          </radialGradient>
          <linearGradient id="trunk" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c08a5d" />
            <stop offset="100%" stopColor="#7a4f2c" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="222" rx="70" ry="8" fill="#FFE9EE" />

        <motion.rect
          x="96"
          width="8"
          y={222 - trunkHeight}
          height={trunkHeight}
          rx={4}
          fill="url(#trunk)"
          initial={{ height: 0, y: 222 }}
          animate={{ height: trunkHeight, y: 222 - trunkHeight }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {lv >= 2 && (
          <motion.circle
            cx="100"
            cy={222 - trunkHeight - canopy / 2}
            r={canopy}
            fill="url(#canopy)"
            initial={{ r: 0 }}
            animate={{ r: canopy }}
            transition={{ delay: 0.2, duration: 0.4 }}
          />
        )}
        {lv >= 4 && (
          <circle
            cx="78"
            cy={222 - trunkHeight - canopy / 2 + 4}
            r={canopy * 0.65}
            fill="#FFC1CC"
            opacity="0.7"
          />
        )}
        {lv >= 6 && (
          <circle
            cx="122"
            cy={222 - trunkHeight - canopy / 2 + 4}
            r={canopy * 0.65}
            fill="#FFB300"
            opacity="0.5"
          />
        )}
        {lv >= 8 && (
          <>
            <circle cx="40" cy="130" r="3" fill="#C2185B" opacity="0.6" />
            <circle cx="160" cy="150" r="3" fill="#C2185B" opacity="0.6" />
            <circle cx="50" cy="170" r="2" fill="#FFB300" />
          </>
        )}
      </motion.svg>

      <div className="text-center flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Lv. {lv}</span>
        <span className="text-base font-semibold">{t(`sync.tree_stage.${lv}` as const)}</span>
        <span className="text-2xl font-semibold tabular-nums text-[var(--color-rose)]">
          {totalScore}
        </span>
      </div>

      {lv < 8 && (
        <div className="w-full max-w-[200px]">
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-rose)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-1">
            {t("sync.next_level_in", { n: remain })}
          </p>
        </div>
      )}
    </div>
  );
}
