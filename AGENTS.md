<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# howu agent rules

任何 AI agent 動工前讀 [`CLAUDE.md`](./CLAUDE.md) §0 鐵則,以及完整規格(§4 schema、§5 核心流程、§7 商業邏輯、§11 命名表)。

## 鐵則

- 主畫面 = 今日問卷;不要為了塞功能稀釋它。
- PWA 限制:不要用 React Native / Capacitor 才有的 API。
- 所有 Supabase table 都啟用 RLS,寫 query 要假設 RLS 在阻擋。
- OpenAI / Stripe key 走後端代理,絕不可進前端 bundle。
- migration 必寫,不要用 destructive SQL 改 production schema。

## 禁用詞

- 「懲罰」「Punishment」 → 用「承諾」/ Promises
- 「對方還沒寫,催他!」 → 用「等對方收到」
- 「打卡」 → 用「完成今日」

## 寫 PR 之前

- type-check:`npx tsc --noEmit`
- lint:`npm run lint`
- 在 staging Supabase 跑過 migration
