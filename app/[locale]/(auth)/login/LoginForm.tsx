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

  async function onSubmit({ email }: { email: string }) {
    try {
      const supabase = createClient();
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin)
        .replace(/^[﻿ ]+/, "")
        .trim();
      // 把 next 串進 callback URL,登入完轉去原本要去的頁面
      const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callbackUrl },
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
        <div className="text-4xl" aria-hidden>📬</div>
        <h2 className="text-xl font-semibold">{t("auth.magic_sent_title")}</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {t("auth.magic_sent_body", { email: getValues("email") })}
        </p>
        <button
          type="button"
          className="mt-2 text-sm text-[var(--color-rose)] underline"
          onClick={() => setSent(false)}
        >
          {t("auth.magic_resend")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="email">
          {t("auth.email")}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="hello@howu.online"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-500">{t("auth.email_invalid")}</p>}
      </div>
      <Button type="submit" loading={isSubmitting} fullWidth size="lg">
        {t("auth.send_magic_link")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" fullWidth size="lg" onClick={notReady}>
          {t("auth.with_line")}
        </Button>
        <Button type="button" variant="secondary" fullWidth size="lg" onClick={notReady}>
          {t("auth.with_google")}
        </Button>
        <Button type="button" variant="secondary" fullWidth size="lg" onClick={notReady}>
          {t("auth.with_apple")}
        </Button>
      </div>
    </form>
  );
}
