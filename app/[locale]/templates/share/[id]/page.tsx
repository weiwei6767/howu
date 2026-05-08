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

export default async function TemplateSharePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!isUuid(id)) {
    return <NotFound t={t} />;
  }

  const admin = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc("get_shared_template", {
    p_template_id: id,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return <NotFound t={t} />;
  }

  const tpl: SharedTemplate = Array.isArray(data) ? data[0] : data;

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

function NotFound({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <div className="max-w-md mx-auto px-4 pt-20 pb-20 text-center flex flex-col gap-4">
      <h1 className="font-serif text-2xl">{t("template_share.not_found_title")}</h1>
      <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
        {t("template_share.not_found_body")}
      </p>
      <Link
        href="/"
        className="text-sm underline underline-offset-2 text-[var(--color-ink)] mt-2"
      >
        howu.online
      </Link>
    </div>
  );
}
