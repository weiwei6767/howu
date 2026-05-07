-- howu — fix pair page 抓不到邀請的 RLS bug
-- 原本只有 inviter 能 SELECT 自己的 invitations,B 登入後讀不到 A 的邀請。
-- 加一條 policy 允許任何人查 pending + 未過期的邀請(token 本來就在 URL,
-- 給「同樣有 token 的人」看到對應 row 不算多 leak)。

drop policy if exists "invitations_token_pending_read" on public.invitations;
create policy "invitations_token_pending_read" on public.invitations
  for select using (
    status = 'pending'
    and expires_at > now()
  );
