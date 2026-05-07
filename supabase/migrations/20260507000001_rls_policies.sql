-- howu RLS 政策 — 對應 CLAUDE.md §4.2
-- 原則:所有 table 啟用 RLS;個人私密資料只有自己可見;couple 範圍資料雙方可見。

-- 啟用 RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.invitations enable row level security;
alter table public.question_packs enable row level security;
alter table public.questions enable row level security;
alter table public.daily_responses enable row level security;
alter table public.sync_scores enable row level security;
alter table public.sync_score_events enable row level security;
alter table public.four_grid_responses enable row level security;
alter table public.journal_entries enable row level security;
alter table public.milestones enable row level security;
alter table public.shared_photos enable row level security;
alter table public.promises enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.push_subscriptions enable row level security;

-- 工具 function:檢查兩個 user 是否同一個 active couple
create or replace function public.is_partner_of(other_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couples c
    where c.status = 'active'
      and (
        (c.partner_a_id = auth.uid() and c.partner_b_id = other_uid)
        or (c.partner_b_id = auth.uid() and c.partner_a_id = other_uid)
      )
  );
$$;

create or replace function public.is_couple_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couples c
    where c.id = cid
      and auth.uid() in (c.partner_a_id, c.partner_b_id)
  );
$$;

-- ───────────────────────────── profiles
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_partner_read" on public.profiles
  for select using (public.is_partner_of(id));
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- ───────────────────────────── couples
create policy "couples_member_read" on public.couples
  for select using (auth.uid() in (partner_a_id, partner_b_id));
-- 寫入走 RPC(server-side function),這裡不開 update/insert/delete

-- ───────────────────────────── invitations
create policy "invitations_inviter_read" on public.invitations
  for select using (auth.uid() = inviter_id);
create policy "invitations_inviter_insert" on public.invitations
  for insert with check (auth.uid() = inviter_id);
create policy "invitations_inviter_update" on public.invitations
  for update using (auth.uid() = inviter_id);
-- 接受邀請走 RPC

-- ───────────────────────────── question_packs (公開讀)
create policy "question_packs_public_read" on public.question_packs
  for select using (true);
create policy "question_packs_creator_write" on public.question_packs
  for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

-- ───────────────────────────── questions (公開讀)
create policy "questions_public_read" on public.questions
  for select using (true);

-- ───────────────────────────── daily_responses
create policy "daily_responses_self_all" on public.daily_responses
  for all using (auth.uid() = responder_id) with check (auth.uid() = responder_id);
-- 對方可讀(僅 active couple),且 secret 'private' 一律不出現。
-- 注意:此 policy 把 secret_message 也曝露給對方;應用層或 view 應在 secret 還沒送達或 'private' 時遮罩此欄位。
create policy "daily_responses_partner_read" on public.daily_responses
  for select using (
    auth.uid() <> responder_id
    and public.is_couple_member(couple_id)
  );

-- ───────────────────────────── sync_scores / sync_score_events
create policy "sync_scores_member_read" on public.sync_scores
  for select using (public.is_couple_member(couple_id));
create policy "sync_events_member_read" on public.sync_score_events
  for select using (public.is_couple_member(couple_id));
-- 寫入由 Edge Function 用 service role 處理

-- ───────────────────────────── four_grid_responses
create policy "four_grid_self_all" on public.four_grid_responses
  for all using (auth.uid() = responder_id) with check (auth.uid() = responder_id);
create policy "four_grid_partner_read" on public.four_grid_responses
  for select using (
    auth.uid() <> responder_id
    and public.is_couple_member(couple_id)
  );

-- ───────────────────────────── journal_entries
create policy "journal_self_all" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_shared_read" on public.journal_entries
  for select using (
    shared_with_partner = true
    and public.is_partner_of(user_id)
  );

-- ───────────────────────────── milestones / shared_photos / promises (couple 範圍)
create policy "milestones_member_all" on public.milestones
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "shared_photos_member_read" on public.shared_photos
  for select using (public.is_couple_member(couple_id));
create policy "shared_photos_uploader_write" on public.shared_photos
  for insert with check (auth.uid() = uploader_id and public.is_couple_member(couple_id));
create policy "shared_photos_uploader_update" on public.shared_photos
  for update using (auth.uid() = uploader_id);
create policy "shared_photos_uploader_delete" on public.shared_photos
  for delete using (auth.uid() = uploader_id);

create policy "promises_member_all" on public.promises
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- ───────────────────────────── subscriptions / orders (僅自己)
create policy "subscriptions_self_read" on public.subscriptions
  for select using (auth.uid() = user_id);
-- 寫入由 webhook 用 service role 處理

create policy "orders_self_read" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_self_insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- ───────────────────────────── push_subscriptions
create policy "push_self_all" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
