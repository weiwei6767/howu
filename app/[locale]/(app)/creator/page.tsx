import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Pack {
  id: string;
  name_zh: string;
  description_zh: string | null;
  price_twd: number | null;
  is_active: boolean | null;
  published_at: string | null;
  type: string | null;
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packsRaw } = await (supabase as any)
    .from("question_packs")
    .select("id, name_zh, description_zh, price_twd, is_active, published_at, type")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  const packs = (packsRaw as Pack[] | null) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{locale === "en" ? "Creator" : "創作者後台"}</h1>
        <Link href="/creator/packs/new">
          <Button size="sm">
            {locale === "en" ? "+ New pack" : "+ 新建題包"}
          </Button>
        </Link>
      </header>

      <Card className="text-sm text-zinc-600 leading-relaxed">
        把你想到的兩人題目集結成包,先給自己情侶用,之後可以申請上架到商城分潤。
        免費包是「個人版」(僅你跟對方拿到題目),付費包要審核通過才會出現在商城。
      </Card>

      {packs.length === 0 ? (
        <Card className="text-center text-sm text-zinc-400 py-8">
          還沒有任何題包,點右上「新建」開始
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {packs.map((p) => (
            <li key={p.id}>
              <Link
                href={`/creator/packs/${p.id}`}
                className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 hover:shadow-md"
              >
                <span className="text-2xl">📦</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name_zh}</span>
                    {p.published_at ? (
                      <Badge tone="green">已上架</Badge>
                    ) : (
                      <Badge tone="neutral">草稿</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    {p.description_zh}
                  </p>
                </div>
                {p.price_twd ? (
                  <span className="text-sm font-semibold tabular-nums">
                    NT${p.price_twd}
                  </span>
                ) : (
                  <span className="text-xs text-green-600">免費</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
