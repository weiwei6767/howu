# CLAUDE.md — howu 開發指令

> 給 Claude Code 的核心指令文件。任何修改前先讀這份。

---

## 0. 動工前的鐵則

- **先 survey codebase**:每次動工前先 `ls` / `tree` 看現有檔案結構,不要假設
- **核心是「每日問卷」**:任何功能設計都要回答「這讓今天的問卷更值得寫嗎?」如果答案是 no,優先級降後
- **PWA 不是原生 App**:不要用任何只在 React Native / Capacitor 才有的 API
- **單一語言時優先 zh-TW**,但 i18n 從第一天就要架好,不要事後重構
- **不要 over-engineer**:vibe coding 風格,跑得起來再優化
- **每個 feature 先寫 happy path,再處理 edge case**
- **資料庫 schema 一旦上 production 不要亂改**:migrations 一定要有,不要用 destructive SQL

---

## 1. 產品定位(一句話)

howu 是 **以每日問卷為核心** 的情侶關係 PWA,讓兩人花 2-3 分鐘累積一份共寫的日常,並把累積轉化為默契值、回憶冊與實體紀念品。

定位語:**「兩個人的日記、一份共寫的日常」**

---

## 2. 技術棧

```
前端:Next.js 14+ (App Router) + TypeScript + Tailwind CSS
PWA:next-pwa + manifest.json + Service Worker
i18n:next-intl(zh-TW 預設、en 第二語言)
狀態:Zustand
動畫:Framer Motion
表單:React Hook Form + Zod
日期:date-fns(避免 moment.js)

後端:Supabase
  - PostgreSQL
  - Realtime
  - Auth(LINE / Google / Apple)
  - Storage(照片、PDF)
  - Edge Functions(默契計算、月報生成、推播 trigger)

推播:Web Push API + Service Worker(主)
     OneSignal(備援)

金流:Stripe(信用卡訂閱)+ LINE Pay + 街口支付
發票:ezPay(雲端發票)

AI:OpenAI API(模板生成)
分析:PostHog
錯誤監控:Sentry
```

**禁用**:
- ❌ React Native / Expo(這是 PWA,不是原生)
- ❌ moment.js(用 date-fns)
- ❌ localStorage 存敏感資料(用 Supabase Auth session)
- ❌ 直接呼叫 OpenAI API(走後端 Edge Function 代理,別把 key 放前端)

---

## 3. 資料夾結構

```
/
├── app/
│   ├── [locale]/              # i18n routing
│   │   ├── (auth)/            # 未登入區
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── pair/[token]/  # 邀請連結 landing
│   │   ├── (app)/             # 已登入區
│   │   │   ├── page.tsx       # 主畫面 = 今日問卷
│   │   │   ├── us/            # 「我們」頁面
│   │   │   ├── journal/       # 個人日記
│   │   │   ├── memories/      # 回憶冊
│   │   │   ├── store/         # 商城(模板包、實體商品)
│   │   │   ├── leaderboard/   # 排行榜
│   │   │   └── settings/
│   │   └── layout.tsx
│   └── api/                    # API routes(僅 webhook 用,主要走 Supabase)
├── components/
│   ├── questionnaire/          # 問卷相關元件
│   │   ├── DailyQuestionnaire.tsx
│   │   ├── FixedQuestion.tsx
│   │   ├── RotatingQuestion.tsx
│   │   ├── MoodTags.tsx
│   │   └── SecretMessage.tsx
│   ├── sync/                   # 默契值
│   │   ├── SyncTree.tsx
│   │   ├── SyncScore.tsx
│   │   └── FourGrid.tsx        # 四格題
│   ├── couple/                 # 情侶基本盤
│   │   ├── DDayCounter.tsx
│   │   ├── MilestoneCountdown.tsx
│   │   └── SharedAlbum.tsx
│   ├── journal/
│   ├── memories/
│   └── ui/                     # 基礎 UI 元件(Button, Card, Modal...)
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # 前端 client
│   │   ├── server.ts          # SSR client
│   │   └── types.ts           # auto-generated types
│   ├── sync/
│   │   └── calculator.ts      # 默契值計算邏輯
│   ├── questions/
│   │   ├── fixed.ts           # 5 固定題
│   │   ├── rotating.ts        # 60+ 輪換題
│   │   └── selector.ts        # 每日選題演算法
│   ├── i18n/
│   └── utils/
├── messages/                   # i18n 翻譯
│   ├── zh-TW.json
│   └── en.json
├── public/
│   ├── icons/                  # PWA icons
│   ├── manifest.json
│   └── sw.js
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   └── seed.sql                # 題庫初始資料
└── types/
    └── index.ts                # 全域型別
```

---

## 4. 資料庫 Schema(Supabase / PostgreSQL)

### 4.1 核心 tables

```sql
-- 使用者(對應 auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  birthday date,
  locale text default 'zh-TW' check (locale in ('zh-TW', 'en')),
  emoji_pack jsonb default '[]'::jsonb,  -- Premium 自訂 emoji
  is_premium boolean default false,
  premium_expires_at timestamptz,
  created_at timestamptz default now()
);

-- 情侶配對
create table couples (
  id uuid primary key default gen_random_uuid(),
  partner_a_id uuid references profiles(id) on delete cascade,
  partner_b_id uuid references profiles(id) on delete cascade,
  paired_at timestamptz default now(),
  together_since date not null,                    -- D-Day
  relationship_type text check (relationship_type in ('cohabit', 'same_city', 'long_distance')),
  status text default 'active' check (status in ('active', 'paused', 'disconnected', 'recovery')),
  paused_at timestamptz,
  disconnected_at timestamptz,
  recovery_until timestamptz,                      -- 30 天恢復期(Premium 90 天)
  unique(partner_a_id, partner_b_id)
);

-- 邀請(配對前)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references profiles(id) on delete cascade,
  token text unique not null,                       -- 短連結 token
  message text,                                     -- 邀請訊息
  message_style text check (message_style in ('cute', 'simple', 'custom')),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  accepted_by_id uuid references profiles(id),
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

-- 每日問卷答案
create table daily_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  responder_id uuid references profiles(id) on delete cascade,
  date date not null,                              -- 該答案對應的日期
  
  -- 固定 5 題
  happiness int check (happiness between 1 and 10),
  energy int check (energy between 1 and 10),
  stress int check (stress between 1 and 10),
  miss_partner int check (miss_partner between 1 and 10),
  us_overall int check (us_overall between 1 and 10),
  
  -- 輪換題答案(jsonb 因為題型多樣)
  rotating_answers jsonb not null default '[]'::jsonb,
  -- 結構: [{ question_id, type, value, ... }]
  
  -- 心情標籤
  mood_tags text[] default '{}',
  
  -- 悄悄話
  secret_message text,
  secret_delivery_mode text check (secret_delivery_mode in ('immediate', 'tomorrow', 'scheduled', 'private')),
  secret_delivery_at timestamptz,
  secret_read_at timestamptz,
  secret_archived boolean default false,
  
  completed_at timestamptz default now(),
  unique(couple_id, responder_id, date)
);

-- 輪換題庫
create table questions (
  id text primary key,                              -- 'q_partner_happiness_today'
  category text not null check (category in ('interaction', 'observe', 'intimacy', 'gratitude', 'time', 'open')),
  type text not null check (type in ('slider', 'multi_choice', 'short_text', 'guess_partner')),
  text_zh text not null,
  text_en text not null,
  options_zh jsonb,                                 -- 多選題選項
  options_en jsonb,
  for_relationship_types text[] default '{cohabit,same_city,long_distance}',
  is_premium boolean default false,
  pack_id uuid references question_packs(id),     -- 屬於哪個包(NULL = 官方核心)
  weight int default 1                              -- 抽題權重
);

-- 題包(節日、聯名、用戶自製)
create table question_packs (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text,
  description_zh text,
  creator_id uuid references profiles(id),
  type text check (type in ('official', 'seasonal', 'creator', 'user_custom')),
  price_twd int default 0,                          -- 0 = 免費或 Premium 包含
  is_premium_included boolean default false,
  cover_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- 默契值
create table sync_scores (
  couple_id uuid primary key references couples(id) on delete cascade,
  total_score int default 0,
  level int default 1,
  last_calculated_at timestamptz default now(),
  cooled_down boolean default false                  -- 60 天無互動進入冷卻
);

-- 默契值變動紀錄(用於月報、防作弊稽核)
create table sync_score_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  date date not null,
  source text not null,                              -- 'fixed_q', 'rotating_q', 'guess_partner', 'four_grid'
  source_detail jsonb,
  delta int not null,
  created_at timestamptz default now()
);

-- 四格題
create table four_grid_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  responder_id uuid references profiles(id) on delete cascade,
  date date not null,
  theme text not null,                                -- 'mood', 'food', 'animal', 'color', 'scene'
  selected_index int check (selected_index between 0 and 3),
  custom_photo_url text,                              -- Premium 自拍版
  custom_photo_category text,                         -- AI 分類結果
  created_at timestamptz default now(),
  unique(couple_id, responder_id, date)
);

-- 個人日記(完全私密)
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  content text,
  attached_response_id uuid references daily_responses(id),  -- 可選擇附上當日問卷數據
  shared_with_partner boolean default false,         -- 單篇分享(可撤回)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 紀念日
create table milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  title text not null,
  date date not null,
  type text check (type in ('anniversary', 'first_meet', 'first_trip', 'birthday_a', 'birthday_b', 'custom')),
  recurring boolean default true,                    -- 每年提醒
  created_at timestamptz default now()
);

-- 共同相簿
create table shared_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  uploader_id uuid references profiles(id) on delete cascade,
  url text not null,
  caption text,
  taken_at date,
  created_at timestamptz default now()
);

-- 承諾系統(原「懲罰系統」改名)
create table promises (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) on delete cascade,
  text_zh text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- 訂閱
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  provider text check (provider in ('stripe', 'line_pay', 'jkopay')),
  provider_subscription_id text,
  status text check (status in ('active', 'cancelled', 'past_due', 'expired')),
  plan text check (plan in ('monthly', 'yearly')),
  amount_twd int,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

-- 訂單(實體商品、單售模板包)
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  couple_id uuid references couples(id),
  items jsonb not null,                              -- [{ type, sku, qty, price, customization }]
  total_twd int not null,
  shipping_address jsonb,                            -- 寄送資料(僅實體商品)
  status text check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number text,
  expedited boolean default false,                   -- 24h 急件
  created_at timestamptz default now()
);

-- 推播訂閱(Web Push)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz default now()
);
```

### 4.2 RLS(Row Level Security)規則

**所有 table 啟用 RLS**。基本原則:

```sql
-- 自己的 profile 自己讀寫
create policy "users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- 情侶配對:雙方都能讀,不能直接 update(用 RPC)
create policy "couple members read couple" on couples
  for select using (auth.uid() in (partner_a_id, partner_b_id));

-- 每日問卷答案:自己的可讀寫,對方的只能讀(且必須是同一 couple)
create policy "users read own responses" on daily_responses
  for select using (auth.uid() = responder_id);
create policy "users read partner responses" on daily_responses
  for select using (
    exists (
      select 1 from couples
      where id = daily_responses.couple_id
        and auth.uid() in (partner_a_id, partner_b_id)
        and status = 'active'
    )
    -- 但悄悄話只有送達後才看得到
    -- 這個用 view 處理:partner_visible_responses
  );

-- 個人日記:純私密,只有自己能看
create policy "users only see own journal" on journal_entries
  for all using (auth.uid() = user_id);

-- 分享日記例外:shared_with_partner = true 時對方可讀
create policy "partner reads shared journal" on journal_entries
  for select using (
    shared_with_partner = true
    and exists (
      select 1 from couples c
      where (c.partner_a_id = auth.uid() or c.partner_b_id = auth.uid())
        and (c.partner_a_id = journal_entries.user_id or c.partner_b_id = journal_entries.user_id)
        and c.status = 'active'
    )
  );
```

---

## 5. 核心功能實作規格

### 5.1 每日問卷流程(Critical Path)

```
用戶開啟 App 
  → 檢查今日是否完成
    → 已完成: 顯示「我們」頁面 + 對方狀態(若已完成)
    → 未完成: 進入問卷流程
      → 載入今日題目(call selectTodayQuestions(coupleId, userId, date))
      → 5 固定題(滑桿)
      → 6 輪換題(類型混合)
      → 心情標籤
      → 「偷偷想跟你說」(可選)
      → 提交 → 寫入 daily_responses
      → trigger 默契值計算(若對方已完成)
      → 顯示完成畫面 + 對方狀態 + streak 更新
```

### 5.2 每日選題演算法

`lib/questions/selector.ts`:

```typescript
export async function selectTodayQuestions(
  coupleId: string,
  userId: string,
  date: Date,
  relationshipType: 'cohabit' | 'same_city' | 'long_distance'
): Promise<RotatingQuestion[]> {
  // 規則:
  // 1. 從 6 大類別各抽 1 題
  // 2. 同一題不在 14 天內重複(查 daily_responses)
  // 3. 同類別不連續兩天出現相同題
  // 4. 短文字題每天最多 2 題
  // 5. 過濾 relationship_type 不符的題
  // 6. Premium 用戶可使用 is_premium = true 的題
  // 7. 同一 couple 兩人看到同樣的題(用 couple_id + date 為 seed)
  
  const seed = hashSeed(coupleId, date);
  const recentQuestionIds = await getRecentQuestionIds(coupleId, 14);
  const allQuestions = await getEligibleQuestions(relationshipType);
  
  return pickQuestions({
    pool: allQuestions,
    excludeIds: recentQuestionIds,
    categoryDistribution: ['interaction', 'observe', 'intimacy', 'gratitude', 'time', 'open'],
    maxShortText: 2,
    seed,
  });
}
```

### 5.3 默契值計算(Edge Function)

觸發時機:雙方都完成當日問卷後

`supabase/functions/calculate-sync/index.ts`:

```typescript
// 計算規則(對應企劃書 5.2.2):
// - 1-10 滑桿: 差距 0 +5 / 差距 1 +2
// - 多選題: 完全相同 +5 / 至少 1 個共同 +2
// - 猜對方分數: 完全猜中 +20 / ±1 +10
// - 四格題: 同格 +30
// - 短文字 v2: AI 判定相似度 +5–15

// 防作弊檢查:
// - 兩人答案間隔 < 5 秒不計分(代答嫌疑)
// - 同 IP/裝置不計分

export async function calculateSyncDelta(
  responseA: DailyResponse,
  responseB: DailyResponse
): Promise<SyncDeltaEvent[]> {
  const events: SyncDeltaEvent[] = [];
  // ...實作
  return events;
}

// 寫入 sync_score_events + 更新 sync_scores.total_score
// 計算當前等級(level = computeLevel(total_score))
// 推播給雙方:「你們的默契又長大了 +N」
```

### 5.4 悄悄話送達邏輯

```typescript
// 寫入時依 delivery_mode 處理:
// - immediate: 對方完成今日問卷後立刻可見
// - tomorrow: secret_delivery_at = 隔日 00:00
// - scheduled: secret_delivery_at = 用戶選定日期
// - private: 永久不對對方顯示(僅自己可見)

// 對方可見性查詢:
// SELECT * FROM daily_responses dr
// WHERE dr.couple_id = $1 AND dr.responder_id != $2
//   AND (
//     dr.secret_delivery_mode = 'immediate' AND 
//       EXISTS (對方完成自己的當日問卷)
//     OR dr.secret_delivery_at <= NOW()
//   )
//   AND dr.secret_delivery_mode != 'private'
```

### 5.5 推播提醒

每日只發 1 次主推播。Cron job(Supabase Edge Function + pg_cron):

```
20:00  - 每日問卷提醒(若未完成)
21:00  - 四格題提醒
23:00  - streak 即將中斷警告(若仍未完成)
即時   - 對方完成、悄悄話送達
```

`supabase/functions/send-daily-reminder/index.ts` 用 `pg_cron` 排程。

### 5.6 i18n 結構

`messages/zh-TW.json`:
```json
{
  "common": {
    "today": "今天",
    "yesterday": "昨天"
  },
  "questionnaire": {
    "title": "今日問卷",
    "fixed": {
      "happiness": "今日份幸福程度",
      ...
    },
    "secret_message": {
      "placeholder": "偷偷想跟你說...",
      "delivery_mode": {
        "immediate": "立即送達",
        ...
      }
    }
  },
  ...
}
```

題庫(`questions` table)的 `text_zh` / `text_en` 欄位**直接存兩語版本**,不走 i18n 檔案。

---

## 6. UI/UX 規範

### 6.1 設計原則
- **主畫面 = 今日問卷**,其他都從這裡延伸
- **2-3 分鐘填完**,任何讓問卷變慢的設計都要重新評估
- **滑桿題視覺優先**:分數越高顏色漸變越濃(幸福從白漸金、壓力從綠漸紅)
- **完成的儀式感**:streak 火焰動畫、樹成長動畫、信封拆封動畫
- **不焦慮設計**:對方未完成不顯示「催促」文案,改為「等對方收到」

### 6.2 配色(初稿,可依設計師調整)
```
主色:    #C2185B (玫瑰粉)
次色:    #FFC1CC (淡粉)
強調色:  #FFB300 (暖金,給高分視覺)
成功色:  #4CAF50
警告色:  #FF9800
錯誤色:  #E53935
中性灰:  #555555 / #888888 / #CCCCCC
背景:    #FFF8F8(暖白)/ 深色模式 #1A1A1A
```

### 6.3 字型
- 中文:Noto Sans TC / 思源黑體
- 英文:Inter
- 手寫風(悄悄話顯示):Caveat / 王漢宗等寬字體

### 6.4 元件原則
- 圓角:8px(卡片)、12px(按鈕)、24px(主要 CTA)
- 陰影:極淺 `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- 動畫時長:150-300ms,用 ease-out
- 觸覺回饋:重要按鈕加 `navigator.vibrate(10)`

---

## 7. 商業邏輯規則

### 7.1 訂閱規則
- **單方訂閱、雙方共享**:任一方 `is_premium = true` 時,雙方都享有 Premium 功能
- 查詢時用:`couple.partner_a.is_premium OR couple.partner_b.is_premium`
- 訂閱到期 grace period:7 天(避免續費延遲導致功能突然消失)

### 7.2 模板包權限
```typescript
function canUsePack(user: User, partner: User, pack: QuestionPack): boolean {
  if (pack.type === 'official' || pack.price_twd === 0) return true;
  if (pack.is_premium_included && (user.is_premium || partner.is_premium)) return true;
  // 檢查單售購買紀錄
  return hasOwnedPack(user, pack.id) || hasOwnedPack(partner, pack.id);
}
```

### 7.3 換題次數限制
- 免費用戶:每日 2 次
- Premium:不限
- 換題不影響 streak

### 7.4 智慧推薦觸發
- streak 達 100 / 365 / 520 / 1000 → 推薦客製卡片
- 連續 3 天壓力 ≥ 8 → 推薦關心類卡片(僅推給對方,經 opt-in)
- 連續 3 天幸福 ≤ 4 → 推薦 AI 日記模板
- 14 個情人節觸發點 → 全站活動 + 推薦
- 對方生日前 14 天 → 推薦客製卡片
- 紀念日前 7 天 → 推薦紀念禮盒書

---

## 8. 分手機制實作

### 8.1 三層級狀態機
```
active → paused (任一方發起暫停)
active → recovery (任一方發起解除綁定,進入 30 天恢復期)
recovery → active (任一方在期內發起重連,對方同意)
recovery → disconnected (30 天到期)
任何狀態 → deleted (用戶要求刪帳號,72h 處理)
```

### 8.2 重要 UX 規則
- 對方收到「連線結束」通知 **永遠不顯示是誰、為什麼**
- 解除綁定**自動產生回憶冊 PDF**(14 天內可下載)
- 被檢舉場景下,被檢舉方不知對方檢舉,但連線即時切斷
- 解除綁定後 30 天內**任一方發起重連**,對方同意即恢復(資料完整保留)

---

## 9. 安全與隱私

### 9.1 必做
- 所有 table 啟用 RLS
- 敏感欄位(收件地址、悄悄話)在 Supabase 用 pgcrypto 額外加密
- API key、Service role key **絕不**進入前端 bundle
- OpenAI API 走 Edge Function 代理,不暴露 key
- CSP headers 設定嚴格
- Rate limiting:邀請發送、推播註冊、AI 模板生成

### 9.2 個資處理
- 收件地址:訂單完成 90 天後從 `orders.shipping_address` 抹除(改為「已寄送至 ***」標示)
- 推播 endpoint:用戶停用推播或刪帳號時即時刪除
- 解除綁定後對方資料的存取:用 view + RLS 控制,不靠應用層判斷

### 9.3 跨境傳輸告知
隱私政策必須揭露:
- Supabase 在新加坡
- OpenAI 在美國
- Stripe 在美國
- OneSignal 在美國

---

## 10. 開發階段規劃

### Phase 0:設計與規格(1 週)
- [ ] UI 設計稿(Figma)
- [ ] 題庫整理(100 題官方 + 雙語)
- [ ] Supabase schema 建立
- [ ] 環境設定(domain、Supabase project、Stripe test mode)

### Phase 1:Core MVP(3-4 週)
- [ ] Auth 流程(LINE / Google / Apple)
- [ ] 邀請與配對(invitations + couples)
- [ ] 每日問卷(5 固定 + 6 輪換 + 心情 + 悄悄話)
- [ ] 主畫面 + 「我們」頁面
- [ ] D-Day 計數 + 紀念日
- [ ] streak 計算
- [ ] PWA 配置 + 加入主畫面提示
- [ ] i18n 雙語(zh-TW + en)
- [ ] RLS 政策完整設定

### Phase 2:遊戲化與社交(2-3 週)
- [ ] 默契值計算 Edge Function
- [ ] 默契樹視覺(8 等級)
- [ ] 四格題(預設情境版)
- [ ] 個人日記
- [ ] 共同相簿
- [ ] 推播系統(Web Push + 排程)
- [ ] 月度 insight 自動產生

### Phase 3:商業化(2-3 週)
- [ ] Premium 訂閱(Stripe + LINE Pay + 街口)
- [ ] 模板包系統(官方 + 節日 + 創作者)
- [ ] 客製卡片商城
- [ ] 跨情侶排行榜(默契值為主)
- [ ] 承諾系統
- [ ] 解除綁定流程(三層級)
- [ ] 回憶冊 PDF 生成

### Phase 4:延伸(持續)
- [ ] 實體紀念書 print-on-demand 整合
- [ ] AI 模板進階(情緒分析)
- [ ] 創作者經濟(模板上架後台)
- [ ] 朋友榜、雙情侶推薦
- [ ] Capacitor 包裝(視 PWA 表現決定)
- [ ] 自拍版四格題(AI 圖像分類)

---

## 11. 命名與術語(全專案統一)

| 概念 | 程式碼用詞 | 中文 UI | 英文 UI |
|---|---|---|---|
| 情侶配對 | couple | 我們 | Us |
| 每日問卷 | daily_response | 今日問卷 | Today's Check-in |
| 固定題 | fixed_question | 每日心情 | Daily Status |
| 輪換題 | rotating_question | 兩人題 | Couple Questions |
| 悄悄話 | secret_message | 偷偷想跟你說 | Whisper |
| 默契值 | sync_score | 默契值 | Sync |
| 默契等級 | sync_level | 默契等級 | Sync Level |
| 連續天數 | streak | 連續 N 天 | N-day streak |
| 四格題 | four_grid | 今日四格 | Today in 4 Frames |
| 承諾 | promise | 我們的承諾 | Our Promises |
| 回憶冊 | memory_book | 我們的回憶冊 | Our Memory Book |

**禁用詞**:
- ❌ 「懲罰」(已改為「承諾」)
- ❌ 「Punishment」
- ❌ 「對方還沒寫,催他!」(改為「等對方收到」)
- ❌ 「打卡」(過於工具化,用「完成今日」)

---

## 12. Critical Reminders

1. **問卷是核心**,不要為了塞功能而稀釋主畫面
2. **PWA 限制**:Safari 推播必須先加入主畫面,onboarding 要設計教學
3. **單方訂閱雙方共享** 是商業邏輯鐵律,實作時務必檢查雙方 Premium 狀態
4. **悄悄話 private 模式**對方絕對不能查到存在
5. **解除綁定的安全 UX**:文案永遠中性,保護主動方
6. **匿名排行榜**:後段使用者顯示百分位、不顯示具體名次
7. **未成年使用**:16 歲以下完全擋下
8. **不要做廣告變現**,永遠
9. **每次重大功能上線前**,先在 staging 環境測試完整流程
10. **企劃書是真理來源**:有疑問先翻 `howu_企劃書.docx`,再來問

---

## 13. 後續溝通方式

- 任何 schema 變動 → 寫 migration、更新本文件第 4 節
- 任何新功能 → 確認是否回扣到「核心問卷」、更新對應章節
- 任何禁用詞變動 → 更新第 11 節
- 任何商業規則變動(訂閱、抽成、價格) → 更新第 7 節 + 企劃書

---

*版本:2026.05 | 與 howu_企劃書.docx 同步*
