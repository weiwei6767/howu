"use client";

import { useTranslations } from "next-intl";

export function BookControls() {
  const t = useTranslations();
  return (
    <div className="no-print sticky top-2 z-10 flex justify-end items-center gap-3 mb-2">
      <button
        onClick={() => window.print()}
        className="text-sm bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:opacity-90 active:scale-[0.97] transition"
      >
        {t("memory_book.print")}
      </button>
    </div>
  );
}
