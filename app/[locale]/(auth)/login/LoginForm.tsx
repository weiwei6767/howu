"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
});

export function LoginForm() {
  const t = useTranslations();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    getValues,
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  function callbackUrl(): string {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin)
      .replace(/^[﻿ ]+/, "")
      .trim();
    return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function onSubmit({ email }: { email: string }) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) {
        toast(error.message, { tone: "error" });
        return;
      }
      setSent(true);
      toast(t("auth.magic_sent"), { tone: "success" });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    }
  }

  function notReady() {
    toast(t("auth.coming_soon"), { tone: "info" });
  }

  if (sent) {
    return (
      <div className="text-center flex flex-col gap-3">
        <h2 className="font-serif text-2xl">{t("auth.magic_sent_title")}</h2>
        <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
          {t("auth.magic_sent_body", { email: getValues("email") })}
        </p>
        <button
          type="button"
          className="mt-2 text-sm underline underline-offset-2 hover:text-[var(--color-ink-mid)]"
          onClick={() => setSent(false)}
        >
          {t("auth.magic_resend")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-ink-mid)]" htmlFor="email">
          {t("auth.email")}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-[var(--color-danger)]">{t("auth.email_invalid")}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} fullWidth size="lg">
        {t("auth.send_magic_link")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
        <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" fullWidth onClick={notReady}>
          {t("auth.with_line")}
        </Button>
      </div>
    </form>
  );
}
