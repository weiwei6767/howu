import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/templates/TemplateEditor";

interface Template {
  id: string;
  couple_id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

interface Question {
  id: string;
  position: number;
  type: string;
  text: string;
  options: unknown;
}

interface PromiseRow {
  id: string;
  position: number;
  text: string;
}

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplRaw } = await (supabase as any)
    .from("templates")
    .select("id, couple_id, name, description, emoji")
    .eq("id", id)
    .maybeSingle();
  const tpl = tplRaw as Template | null;
  if (!tpl || tpl.couple_id !== couple.id) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qRaw } = await (supabase as any)
    .from("template_questions")
    .select("id, position, type, text, options")
    .eq("template_id", id)
    .order("position");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pRaw } = await (supabase as any)
    .from("template_promises")
    .select("id, position, text")
    .eq("template_id", id)
    .order("position");

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/templates"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← 模板
      </Link>
      <header className="flex items-center gap-3">
        {tpl.emoji && <span className="text-2xl" aria-hidden>{tpl.emoji}</span>}
        <div>
          <h1 className="font-serif text-2xl">{tpl.name}</h1>
          {tpl.description && (
            <p className="text-sm text-[var(--color-ink-mid)] mt-0.5">
              {tpl.description}
            </p>
          )}
        </div>
      </header>

      <TemplateEditor
        templateId={tpl.id}
        templateName={tpl.name}
        templateEmoji={tpl.emoji ?? ""}
        templateDescription={tpl.description ?? ""}
        initialQuestions={(qRaw as Question[] | null) ?? []}
        initialPromises={(pRaw as PromiseRow[] | null) ?? []}
      />
    </div>
  );
}
