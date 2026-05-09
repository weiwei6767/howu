import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function InstallGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 flex flex-col gap-8">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/" as any}
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] self-start"
      >
        ← howu
      </Link>

      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
          Install
        </p>
        <h1 className="font-serif text-3xl mt-1">把 howu 加到主畫面</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-3 leading-relaxed max-w-md mx-auto">
          一秒打開,推播也能收到。整個 app 用瀏覽器跑,
          不會佔像 App Store 那麼多空間。
        </p>
      </header>

      {/* iOS */}
      <Section
        platform="iOS"
        eyebrow="iPhone · iPad"
        steps={[
          {
            title: "用 Safari 打開 howu.online",
            body: "其他瀏覽器(Chrome、Line 內建瀏覽器、IG 內建瀏覽器)都沒辦法,Safari 是唯一可以加到主畫面 + 收推播的。",
          },
          {
            title: "點下方中間的「分享」按鈕",
            body: "就是那個方框 + 向上箭頭的圖示。在最底下工具列中間。",
          },
          {
            title: "選單滑下去找「加入主畫面」",
            body: "點進去後右上會看到「加入」,按下去就完成了。",
          },
          {
            title: "從主畫面打開 howu",
            body: "桌面會出現一顆 howu 圖示。點下去打開後就是 standalone(沒瀏覽器條)的 PWA,推播也才會生效。",
          },
        ]}
      />

      {/* Android */}
      <Section
        platform="Android"
        eyebrow="Chrome"
        steps={[
          {
            title: "用 Chrome 打開 howu.online",
            body: "Chrome 是 Android 最穩的選擇。Edge / Firefox 也行,流程類似。",
          },
          {
            title: "右上角選單 ⋮",
            body: "點開後會看到「加入主畫面」或「Install app」。",
          },
          {
            title: "點「加入主畫面」",
            body: "彈出視窗確認名稱,按「新增」。桌面會多一顆 howu 圖示。",
          },
          {
            title: "從主畫面打開 howu",
            body: "進去後是 standalone 模式,通常 Chrome 還會直接跳推播權限對話框。",
          },
        ]}
      />

      {/* 完成後 */}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-soft)]/40 to-white px-5 py-6 flex flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-deep)]">
          ✦ 完成後
        </p>
        <h2 className="font-serif text-2xl">記得進設定打開推播</h2>
        <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
          從主畫面打開 howu,進「設定 → 推播提醒 → 開啟」。
          這樣對方寫完問卷時,你才會收到通知。
        </p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/settings" as any}
          className="self-start mt-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--color-ink)] text-white text-sm hover:bg-[var(--color-ink-mid)] transition-colors"
        >
          前往設定 →
        </Link>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-6">
        <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
          常見問題
        </h2>
        <Faq
          q="為什麼一定要 Safari / Chrome?"
          a="iOS 的推播 API 只開放給 Safari 安裝的 PWA;Android 上 Chrome 是最完整的支援。Line / Instagram 內建瀏覽器都會擋掉這些功能。"
        />
        <Faq
          q="加進主畫面之後可以正常用嗎?"
          a="跟一般 app 一樣。打開後沒有網址列、沒分頁,跟原生 app 視覺幾乎一樣。"
        />
        <Faq
          q="會佔很多空間嗎?"
          a="幾 MB 而已。本身不下載 binary,純粹瀏覽器 cache + service worker 註冊。"
        />
        <Faq
          q="刪掉怎麼辦?"
          a="長按主畫面 howu 圖示 → 刪除即可。資料還在伺服器,瀏覽器再登入照樣讀得到。"
        />
      </section>
    </div>
  );
}

function Section({
  platform,
  eyebrow,
  steps,
}: {
  platform: string;
  eyebrow: string;
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline gap-3 border-b border-[var(--color-paper-line)] pb-3">
        <span className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
          {eyebrow}
        </span>
        <h2 className="font-serif text-2xl">{platform}</h2>
      </header>
      <ol className="flex flex-col gap-5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent)] text-white font-serif text-base shadow-[0_2px_8px_-2px_rgba(184,50,77,0.45)]">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[15px] text-[var(--color-ink)] leading-snug">
                {s.title}
              </p>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed mt-1">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[var(--color-paper-line)] last:border-b-0 py-3">
      <summary className="list-none cursor-pointer flex items-center justify-between select-none">
        <span className="text-sm text-[var(--color-ink)]">{q}</span>
        <span
          className="text-[var(--color-ink-soft)] text-lg leading-none group-open:rotate-45 transition-transform"
          aria-hidden
        >
          +
        </span>
      </summary>
      <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed mt-2">{a}</p>
    </details>
  );
}
