import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: friendsRaw } = await (supabase as any)
    .from("couple_friends")
    .select("id, couple_a_id, couple_b_id, status, created_at")
    .or(`couple_a_id.eq.${couple.id},couple_b_id.eq.${couple.id}`)
    .order("created_at", { ascending: false });
  const friends =
    (friendsRaw as Array<{
      id: string;
      couple_a_id: string;
      couple_b_id: string;
      status: string;
    }> | null) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{locale === "en" ? "Friends" : "朋友榜"}</h1>
        <p className="text-sm text-zinc-500">
          {locale === "en"
            ? "Add friend couples to compare sync, plan double dates"
            : "把熟識的情侶加進來,比較默契等級、約雙情侶 hangout"}
        </p>
      </header>

      <Card className="text-sm text-zinc-500">
        Phase 4 預覽 · 朋友邀請流程開放中。把對方情侶 ID 給我們,雙方確認後就會出現在這。
      </Card>

      {friends.length === 0 ? (
        <Card className="text-center text-sm text-zinc-400 py-8">
          還沒有朋友。等對方掃你的 howu QR / 你掃他們的就會配對。
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map((f) => {
            const otherId = f.couple_a_id === couple.id ? f.couple_b_id : f.couple_a_id;
            return (
              <li
                key={f.id}
                className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3"
              >
                <span className="text-2xl">💞</span>
                <div className="flex-1">
                  <div className="font-mono text-xs text-zinc-500">{otherId.slice(0, 8)}</div>
                  <Badge tone={f.status === "accepted" ? "rose" : "neutral"}>{f.status}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
