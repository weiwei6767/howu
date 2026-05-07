# howu

> 兩個人的日記、一份共寫的日常。

howu 是以「每日問卷」為核心的情侶關係 PWA。完整產品規格見 [`CLAUDE.md`](./CLAUDE.md) 與 `howu_企劃書.docx`。

## 技術棧

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl · Zustand · Framer Motion · React Hook Form + Zod · Supabase(Postgres / Auth / Realtime / Storage / Edge Functions)。

## 開發

```bash
npm install
cp .env.example .env.local   # 填上 Supabase 等 key
npm run dev
```

預設跑在 `http://localhost:3000`,首頁會自動轉到 `/zh-TW`(預設語言)。

## 資料夾

```
app/[locale]/(app)        已登入區
app/[locale]/(auth)       未登入區
components/               共用元件(ui / questionnaire / sync / couple ...)
lib/
  supabase/               browser / server client + 自動生成型別
  questions/              fixed / rotating / selector(每日選題演算法)
  sync/                   默契值計算
  utils/
i18n/                     next-intl routing & request config
messages/                 zh-TW.json / en.json
public/                   manifest.json / sw.js / icons/
supabase/
  migrations/             SQL migrations(20260507000000_init_schema.sql 等)
  seed.sql                題庫種子
types/                    跨檔共用 TS 型別
```

## Supabase

1. 在 [supabase.com](https://supabase.com) 建專案,把 URL / anon key / service role 填到 `.env.local`。
2. 跑 migration:
   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```
3. 載入種子:`npx supabase db reset` 或在 dashboard 執行 `supabase/seed.sql`。
4. 重新生成 TS 型別:
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > lib/supabase/types.ts
   ```

## 部署 (Vercel)

```bash
vercel link
vercel env pull .env.local
vercel deploy
```

正式 domain `howu.online` 要在 Vercel Project Settings → Domains 綁定;DNS 在網域商面板設成 Vercel 提供的 A / CNAME。

## 鐵則(節錄自 CLAUDE.md §0)

- 主畫面 = 今日問卷,任何功能都要回答「這讓今天的問卷更值得寫嗎?」
- PWA 不是原生 App。不要用 React Native / Capacitor 才有的 API。
- 所有 Supabase table 啟用 RLS。
- OpenAI / Stripe key 一律走後端代理,不可進前端 bundle。
- 動工前先掃過現況,不要假設檔案存在。
