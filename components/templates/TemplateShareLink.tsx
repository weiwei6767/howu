"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/store/toast";

interface Props {
  templateId: string;
}

export function TemplateShareLink({ templateId }: Props) {
  const t = useTranslations();
  const [revealed, setRevealed] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/templates/share/${templateId}`
      : `https://howu.online/templates/share/${templateId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast(t("common.copied"), { tone: "success" });
    } catch {
      toast(url, { tone: "info", duration: 6000 });
    }
  }

  async function shareNative() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: t("template_share.share_title") });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-5">
      <header>
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
          {t("template_share.section_title")}
        </h2>
        <p className="text-xs text-[var(--color-ink-soft)] mt-1 leading-relaxed">
          {t("template_share.section_subtitle")}
        </p>
      </header>

      {revealed ? (
        <>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full text-sm rounded-[var(--radius-button)] border border-[var(--color-paper-line)] bg-white px-3 py-2 text-[var(--color-ink-mid)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={shareNative}
              className="flex-1 h-10 text-sm rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-mid)] transition-colors"
            >
              {t("common.share")}
            </button>
            <button
              type="button"
              onClick={copy}
              className="flex-1 h-10 text-sm rounded-[var(--radius-button)] border border-[var(--color-paper-line)] hover:border-[var(--color-ink-mid)] transition-colors"
            >
              {t("invite.copy_link")}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="self-start text-sm underline underline-offset-2 text-[var(--color-ink-mid)] hover:text-[var(--color-ink)]"
        >
          {t("template_share.show_link")}
        </button>
      )}
    </section>
  );
}
