"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

interface Props {
  hasCouple: boolean;
  coupleStatus: string | null;
}

export function DangerZone({ hasCouple, coupleStatus }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function openMail() {
    const subject = encodeURIComponent(t("delete_account_modal.email_subject"));
    const body = encodeURIComponent(
      t("delete_account_modal.email_body_template", { email: userEmail || "—" }),
    );
    window.location.href = `mailto:hello@loamia.xyz?subject=${subject}&body=${body}`;
  }

  const stillCoupled = hasCouple && coupleStatus === "active";

  return (
    <>
      <section className="flex flex-col gap-1 pt-4 border-t border-[var(--color-paper-line)]">
        <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em] mb-2">
          {t("settings.danger_zone")}
        </h2>
        <button
          onClick={logout}
          className="text-left py-3 text-sm text-[var(--color-ink)] hover:text-[var(--color-ink-mid)] border-b border-[var(--color-paper-line)] transition-colors"
        >
          {t("settings.logout")}
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="text-left py-3 text-sm text-[var(--color-danger)] hover:opacity-80 transition-colors"
        >
          {t("settings.delete_account")}
        </button>
      </section>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("delete_account_modal.title")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={openMail}>
              {t("delete_account_modal.send_email_button")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
            {t("delete_account_modal.intro")}
          </p>

          {stillCoupled && (
            <div className="border-l-2 border-[var(--color-warning)] bg-amber-50/50 pl-3 py-2 text-xs text-[var(--color-ink)] leading-relaxed">
              ⚠ {t("delete_account_modal.couple_warning")}
            </div>
          )}

          <div className="border-l-2 border-[var(--color-paper-line)] pl-3 py-1">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {t("delete_account_modal.what_deleted_title")}
            </p>
            <p className="text-sm leading-relaxed mt-1">
              {t("delete_account_modal.what_deleted_items")}
            </p>
          </div>

          <div className="border-l-2 border-[var(--color-paper-line)] pl-3 py-1">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {t("delete_account_modal.what_kept_title")}
            </p>
            <p className="text-sm leading-relaxed mt-1">
              {t("delete_account_modal.what_kept_items")}
            </p>
          </div>

          <div className="border-l-2 border-[var(--color-accent)] pl-3 py-1">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {t("delete_account_modal.grace_period_title")}
            </p>
            <p className="text-sm leading-relaxed mt-1">
              {t("delete_account_modal.grace_period_body")}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
