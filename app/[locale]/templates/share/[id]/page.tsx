import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUser, getActiveCouple } from "@/lib/supabase/auth";
import { CloneTemplateButton } from "@/components/templates/CloneTemplateButton";

interface SharedTemplate {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  questions: Array<{
    id: string;
    position: number;
    type: string;
    text: string;
    options: string[] | null;
  }>;
  promises: Array<{
    id: string;
    position: number;
    text: string;
  }>;
}

const TYPE_LABEL_KEY: Record<string, string> = {
  slider: "templates.type_slider",
  guess_partner: "templates.type_guess_partner",
  multi_choice: "templates.type_multi_choice",
  short_text: "templates.type_short_text",
  mood_tags: "templates.type_mood_tags",
  letter: "common.share",
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * 嘗試 RPC,失敗或回 0 列就改用 admin client 直接查表 fallback。
 * 這樣即使 SQL migration 沒跑或函式名變動,只要 service_role key 還在
 * 就能載到模板。
 */
async function loadSharedTemplate(id: string): Promise<{
  template: SharedTemplate | null;
  debug?: string;
}> {
  const admin = createSupabaseAdminClient();

  // 1) 試 RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc("get_shared_template", {
    p_template_id: id,
  });
  if (!error && Array.isArray(data) && data.length > 0) {
    return { template: data[0] as SharedTemplate };
  }
  if (!error && data && !Array.isArray(data)) {
    return { template: data as SharedTemplate };
  }

  const rpcMsg = error?.message ?? "rpc returned empty";

  // 2) Fallback:直接用 admin client 查 templates / questions / promises
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplRaw, error: tplErr } = await (admin as any)
    .from("templates")
    .select("id, name, description, emoji, is_archived")
    .eq("id", id)
    .maybeSingle();
  if (tplErr || !tplRaw) {
    return { template: null, debug: `rpc:${rpcMsg} | tpl:${tplErr?.message ?? "none"}` };
  }
  if (tplRaw.is_archived) {
    return { template: null, debug: "archived" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qRaw } = await (admin as any)
    .from("template_questions")
    .select("id, position, type, text, options")
    .eq("template_id", id)
    .order("position");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pRaw } = await (admin as any)
    .from("template_promises")
    .select("id, position, text")
    .eq("template_id", id)
    .order("position");

  return {
    template: {
      id: tplRaw.id,
      name: tplRaw.name,
      description: tplRaw.description ?? null,
      emoji: tplRaw.emoji ?? null,
      questions: ((qRaw as Array<{
        id: string;
        position: number;
        type: string;
        text: string;
        options: unknown;
      }> | null) ?? []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : null,
      })),
      promises: (pRaw as Array<{ id: string; position: number; text: string }> | null) ?? [],
    },
  };
}

export default async function TemplateSharePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isUuid(id)) {
    return <NotFound t={t} debug="invalid_uuid" />;
  }

  const { template: tpl, debug } = await loadSharedTemplate(id);
  if (!tpl) {
    return <NotFound t={t} debug={debug} />;
  }

  // 看當前 user 狀態
  const user = await getUser();
  const couple = user ? await getActiveCouple(user.id) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("template_share.shared_template_label")}
        </p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          {tpl.emoji && <span>{tpl.emoji}</span>}
          <span>{tpl.name}</span>
        </h1>
        {tpl.description && (
          <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
            {tpl.description}
          </p>
        )}
        <p className="text-xs text-[var(--color-ink-soft)] mt-1">
          {t("template_share.preview_meta", {
            qn: tpl.questions.length,
            pn: tpl.promises.length,
          })}
        </p>
      </header>

      {/* CTA */}
      <section>
        {!user ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/templates/share/${id}`)}`}
            className="inline-flex items-center justify-center w-full h-12 rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white text-base hover:bg-[var(--color-ink-mid)] transition-colors"
          >
            {t("template_share.login_to_clone")}
          </Link>
        ) : !couple ? (
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full h-12 rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white text-base hover:bg-[var(--color-ink-mid)] transition-colors"
          >
            {t("template_share.pair_first")}
          </Link>
        ) : (
          <CloneTemplateButton templateId={id} />
        )}
        <p className="text-xs text-[var(--color-ink-soft)] mt-2 leading-relaxed">
          {t("template_share.clone_explainer")}
        </p>
      </section>

      {/* 預覽:題目 */}
      {tpl.questions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
            {t("templates.selected_count", { n: tpl.questions.length })}
          </h2>
          <ul className="flex flex-col">
            {tpl.questions.map((q, i) => (
              <li
                key={q.id}
                className="flex items-baseline gap-3 py-2.5 border-b border-[var(--color-paper-line)] last:border-b-0"
              >
                <span className="font-serif text-sm text-[var(--color-ink-soft)] tabular-nums w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm">{q.text}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
                  {t((TYPE_LABEL_KEY[q.type] ?? "templates.type_short_text") as "templates.type_short_text")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 預覽:承諾 */}
      {tpl.promises.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
            {t("templates.promises_count", { n: tpl.promises.length })}
          </h2>
          <ul className="flex flex-col">
            {tpl.promises.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 py-2 border-l-2 border-[var(--color-accent)] pl-3 mb-1"
              >
                <span className="flex-1 text-sm">{p.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-center pt-4">
        <Link
          href="/"
          className="text-[10px] tracking-[0.4em] uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          howu.online
        </Link>
      </footer>
    </div>
  );
}

function NotFound({
  t,
  debug,
}: {
  t: Awaited<ReturnType<typeof getTranslations>>;
  debug?: string;
}) {
  // 開發模式才印出 debug,不污染 production
  if (debug && process.env.NODE_ENV !== "production") {
    console.error("[template-share] not found:", debug);
  }
  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-20 text-center flex flex-col gap-4">
      <h1 className="font-serif text-2xl">{t("template_share.not_found_title")}</h1>
      <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
        {t("template_share.not_found_body")}
      </p>
      {debug && process.env.NODE_ENV !== "production" && (
        <p className="text-[10px] text-[var(--color-ink-soft)] font-mono break-all">
          debug: {debug}
        </p>
      )}
      <Link
        href="/"
        className="text-sm underline underline-offset-2 text-[var(--color-ink)] mt-2"
      >
        howu.online
      </Link>
    </div>
  );
}
