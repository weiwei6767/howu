"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";

export const DEFAULT_MOOD_TAGS = [
  "開心",
  "六六大順",
  "心煩",
  "低氣壓",
  "平常心",
] as const;

export const RECOMMENDED_MOOD_TAGS = [
  "平靜",
  "感謝",
  "累",
  "興奮",
] as const;

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function MoodTagPicker({ selected, onChange }: Props) {
  const [custom, setCustom] = useState("");
  const recommended = RECOMMENDED_MOOD_TAGS.filter((t) => !selected.includes(t));

  function remove(tag: string) {
    onChange(selected.filter((t) => t !== tag));
  }
  function add(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
  }
  function addCustom() {
    if (!custom.trim()) return;
    add(custom);
    setCustom("");
  }

  return (
    <div className="flex flex-col gap-3 border border-[var(--color-paper-line)] rounded-[var(--radius-button)] bg-[var(--color-paper-dim)] p-3">
      {/* 已選 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
          已選 ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-soft)] italic">
            還沒選任何心情(請從下方推薦或自己加)
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => remove(tag)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-mid)] transition-colors"
                title="點擊移除"
              >
                {tag}
                <span className="text-white/70 leading-none">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 推薦 */}
      {recommended.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-[var(--color-paper-line)] pt-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
            推薦
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => add(tag)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-[var(--color-paper-line)] bg-white text-[var(--color-ink-mid)] hover:border-[var(--color-ink-mid)] hover:text-[var(--color-ink)] transition-colors"
              >
                {tag}
                <span className="text-[var(--color-ink-soft)] leading-none">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 自己加 */}
      <div className="flex gap-2 border-t border-[var(--color-paper-line)] pt-3">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="自己加一個情緒(例:緊張)"
          maxLength={10}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-4 h-10 rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white text-sm disabled:opacity-40 shrink-0"
        >
          加
        </button>
      </div>
    </div>
  );
}
