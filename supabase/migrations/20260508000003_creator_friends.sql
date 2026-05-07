-- howu Phase 4 — 創作者後台 + 朋友榜 schema

-- ─────────────────────── 創作者:允許 pack creator 對自己 pack 的 questions 寫入
drop policy if exists "questions_pack_creator_insert" on public.questions;
create policy "questions_pack_creator_insert" on public.questions
  for insert with check (
    pack_id is not null and exists (
      select 1 from public.question_packs p
      where p.id = pack_id and p.creator_id = auth.uid()
    )
  );

drop policy if exists "questions_pack_creator_update" on public.questions;
create policy "questions_pack_creator_update" on public.questions
  for update using (
    pack_id is not null and exists (
      select 1 from public.question_packs p
      where p.id = pack_id and p.creator_id = auth.uid()
    )
  );

drop policy if exists "questions_pack_creator_delete" on public.questions;
create policy "questions_pack_creator_delete" on public.questions
  for delete using (
    pack_id is not null and exists (
      select 1 from public.question_packs p
      where p.id = pack_id and p.creator_id = auth.uid()
    )
  );

-- ─────────────────────── 朋友(雙情侶關係)
create table if not exists public.couple_friends (
  id uuid primary key default gen_random_uuid(),
  couple_a_id uuid references public.couples(id) on delete cascade,
  couple_b_id uuid references public.couples(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  initiated_by_couple uuid references public.couples(id),
  created_at timestamptz default now(),
  accepted_at timestamptz,
  unique (couple_a_id, couple_b_id)
);

create index if not exists idx_couple_friends_a on public.couple_friends(couple_a_id);
create index if not exists idx_couple_friends_b on public.couple_friends(couple_b_id);

alter table public.couple_friends enable row level security;

drop policy if exists "couple_friends_member_read" on public.couple_friends;
create policy "couple_friends_member_read" on public.couple_friends
  for select using (
    public.is_couple_member(couple_a_id) or public.is_couple_member(couple_b_id)
  );

-- 寫入由 RPC 處理(避免直接從 client 寫入 couple_b_id 不存在的情況)

-- ─────────────────────── 朋友邀請 RPC
create or replace function public.invite_couple_friend(p_friend_couple_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_couple_id uuid;
  v_id uuid;
begin
  -- 找自己的 active couple
  select id into v_my_couple_id from public.couples
    where status = 'active'
      and auth.uid() in (partner_a_id, partner_b_id)
    limit 1;
  if v_my_couple_id is null then raise exception 'no_active_couple'; end if;
  if v_my_couple_id = p_friend_couple_id then raise exception 'cannot_friend_self'; end if;

  -- 確認對方存在 active couple
  if not exists (select 1 from public.couples where id = p_friend_couple_id and status = 'active') then
    raise exception 'friend_couple_not_found';
  end if;

  insert into public.couple_friends (couple_a_id, couple_b_id, status, initiated_by_couple)
  values (least(v_my_couple_id, p_friend_couple_id), greatest(v_my_couple_id, p_friend_couple_id),
    'pending', v_my_couple_id)
  on conflict (couple_a_id, couple_b_id) do nothing
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'status', 'pending');
end;
$$;

create or replace function public.accept_couple_friend(p_friendship_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_my_couple uuid;
begin
  select id into v_my_couple from public.couples
    where status = 'active' and auth.uid() in (partner_a_id, partner_b_id) limit 1;
  if v_my_couple is null then raise exception 'no_active_couple'; end if;

  update public.couple_friends
    set status = 'accepted', accepted_at = now()
    where id = p_friendship_id
      and v_my_couple in (couple_a_id, couple_b_id)
      and initiated_by_couple <> v_my_couple
      and status = 'pending';
  return jsonb_build_object('status', 'accepted');
end;
$$;

grant execute on function public.invite_couple_friend(uuid) to authenticated;
grant execute on function public.accept_couple_friend(uuid) to authenticated;
