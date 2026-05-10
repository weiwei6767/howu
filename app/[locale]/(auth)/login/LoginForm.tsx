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

type OAuthProvider = "google" | "apple";

export function LoginForm() {
  const t = useTranslations();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [sent, setSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
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

  async function loginWithOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl(),
        },
      });
      if (error) {
        toast(error.message, { tone: "error", duration: 6000 });
        setOauthLoading(null);
      }
      // 成功的話會 redirect 走,不需要清 loading
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
      setOauthLoading(null);
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
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => loginWithOAuth("google")}
          loading={oauthLoading === "google"}
          disabled={!!oauthLoading}
        >
          <GoogleIcon />
          <span>{t("auth.with_google")}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => loginWithOAuth("apple")}
          loading={oauthLoading === "apple"}
          disabled={!!oauthLoading}
        >
          <AppleIcon />
          <span>{t("auth.with_apple")}</span>
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={notReady}>
          {t("auth.with_line")}
        </Button>
      </div>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
