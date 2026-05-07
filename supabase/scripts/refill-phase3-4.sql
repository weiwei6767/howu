-- howu Phase 3+4 — 合併所有新 migrations,貼進 Supabase SQL Editor 一次跑完
-- 包含:premium helpers / pack_purchases / leaderboard / monthly_insight / creator policies / friends

begin;

-- ===== 20260508000000_premium_helpers.sql =====
-- howu Phase 3 — Premium 訂閱 helpers
-- 規則(CLAUDE.md §7.1):任一方訂閱,雙方共享 Premium。

-- ─── is_premium_user
create or replace function public.is_premium_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select true
      from public.profiles p
      where p.id = p_user_id
        and p.is_premium = true
        and (p.premium_expires_at is null or p.premium_expires_at > now() - interval '7 days')
      limit 1
    ),
    false
  );
$$;

-- ─── is_premium_couple — 任一方 premium 即視為 couple premium
create or replace function public.is_premium_couple(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.is_premium_user(c.partner_a_id)
        or public.is_premium_user(c.partner_b_id)
      from public.couples c
      where c.id = p_couple_id
      limit 1
    ),
    false
  );
$$;

grant execute on function public.is_premium_user(uuid) to authenticated;
grant execute on function public.is_premium_couple(uuid) to authenticated;

-- ─── Subscription webhook 用的 trigger:subscriptions 寫入時順便同步 profile.is_premium
create or replace function public.sync_profile_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    update public.profiles
      set is_premium = true,
          premium_expires_at = new.current_period_end
      where id = new.user_id;
  elsif new.status in ('cancelled', 'expired', 'past_due') then
    -- 7 天 grace period
    update public.profiles
      set is_premium = (new.current_period_end is not null and new.current_period_end > now() - interval '7 days'),
          premium_expires_at = new.current_period_end
      where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_sync_profile on public.subscriptions;
create trigger subscriptions_sync_profile
  after insert or update on public.subscriptions
  for each row execute function public.sync_profile_premium();

-- ===== 20260508000001_pack_purchases.sql =====
-- howu Phase 3 — 題包購買 + sample 節日題包

create table if not exists public.pack_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  pack_id uuid references public.question_packs(id) on delete cascade,
  provider text check (provider in ('stripe','line_pay','jkopay','complimentary')),
  provider_payment_id text,
  amount_twd int not null default 0,
  purchased_at timestamptz default now(),
  unique(user_id, pack_id)
);

create index if not exists idx_pack_purchases_user on public.pack_purchases(user_id);

alter table public.pack_purchases enable row level security;

drop policy if exists "pack_purchases_self_read" on public.pack_purchases;
create policy "pack_purchases_self_read" on public.pack_purchases
  for select using (auth.uid() = user_id);

-- partner 也能看到對方的(這樣 selector 才能 join 兩人擁有)
drop policy if exists "pack_purchases_partner_read" on public.pack_purchases;
create policy "pack_purchases_partner_read" on public.pack_purchases
  for select using (public.is_partner_of(user_id));

-- 寫入由 webhook(service_role)做,前端不直接 insert

-- ─────────────────────────── question_packs 補欄位
alter table public.question_packs add column if not exists slug text;
alter table public.question_packs add column if not exists is_active boolean default true;
create unique index if not exists idx_question_packs_slug on public.question_packs(slug) where slug is not null;

-- ─────────────────────────── 三個範例題包
insert into public.question_packs (id, name_zh, name_en, description_zh, type, price_twd, is_premium_included, slug, published_at)
values
  ('11111111-1111-1111-1111-111111111111',
    '情人節限定包', 'Valentine''s Day Pack',
    '節日專屬 5 題,只在 2/14 前後可抽到',
    'seasonal', 49, true, 'valentine', now()),
  ('22222222-2222-2222-2222-222222222222',
    '長期戀人題包', 'Long-Term Love Pack',
    '在一起超過 3 年的話題,深度題 + 未來規劃',
    'official', 149, true, 'long-term', now()),
  ('33333333-3333-3333-3333-333333333333',
    '遠距離專屬包', 'Long Distance Pack',
    '時差、生活不同步、想念量化的題目',
    'official', 99, true, 'long-distance', now())
on conflict (id) do nothing;

-- 範例題目(各包 5 題,指向 pack_id)
insert into public.questions (id, category, type, text_zh, text_en, options_zh, options_en, for_relationship_types, is_premium, pack_id, weight) values
('q_vd_first_valentine', 'open', 'short_text',
  '記得你們第一個情人節嗎?', 'Remember your first Valentine''s?',
  null, null, '{cohabit,same_city,long_distance}', true,
  '11111111-1111-1111-1111-111111111111', 1),
('q_vd_today_plan', 'time', 'multi_choice',
  '今年情人節怎麼過?', 'How are we spending Valentine''s this year?',
  '["大餐","在家煮飯","小旅行","送禮就好","還沒想"]'::jsonb,
  '["Big dinner","Home cooked","Mini trip","Just gifts","Not sure"]'::jsonb,
  '{cohabit,same_city,long_distance}', true,
  '11111111-1111-1111-1111-111111111111', 1),
('q_vd_say_love_today', 'intimacy', 'guess_partner',
  '猜對方今天說「我愛你」幾次', 'Guess how many "I love you" today',
  null, null, '{cohabit,same_city,long_distance}', true,
  '11111111-1111-1111-1111-111111111111', 1),
('q_vd_gift_wish', 'open', 'short_text',
  '想收到對方什麼禮物?', 'Wish for which gift from them?',
  null, null, '{cohabit,same_city,long_distance}', true,
  '11111111-1111-1111-1111-111111111111', 1),
('q_vd_rose_kiss', 'intimacy', 'multi_choice',
  '喜歡哪種情人節儀式?', 'Favorite Valentine ritual?',
  '["玫瑰","親手卡片","親密夜","什麼都不做"]'::jsonb,
  '["Roses","Handmade card","Intimate night","Nothing special"]'::jsonb,
  '{cohabit,same_city,long_distance}', true,
  '11111111-1111-1111-1111-111111111111', 1),

('q_lt_future_house', 'open', 'short_text',
  '心目中我們以後的房子?', 'Our future home looks like?',
  null, null, '{cohabit,same_city,long_distance}', true,
  '22222222-2222-2222-2222-222222222222', 1),
('q_lt_kids', 'open', 'multi_choice',
  '對小孩的想法?', 'Thoughts on kids?',
  '["想要","還在想","不打算","討論過"]'::jsonb,
  '["Want","Thinking","Not planning","Discussed"]'::jsonb,
  '{cohabit,same_city,long_distance}', true,
  '22222222-2222-2222-2222-222222222222', 1),
('q_lt_career_support', 'gratitude', 'slider',
  '對方在事業上支持你的程度', 'Their career support for you',
  null, null, '{cohabit,same_city,long_distance}', true,
  '22222222-2222-2222-2222-222222222222', 1),
('q_lt_money_view', 'open', 'multi_choice',
  '我們的金錢觀?', 'Our money mindset?',
  '["很合拍","各有想法","有點摩擦","還在磨合"]'::jsonb,
  '["Same page","Different","Friction","Working on it"]'::jsonb,
  '{cohabit,same_city,long_distance}', true,
  '22222222-2222-2222-2222-222222222222', 1),
('q_lt_old_self', 'observe', 'short_text',
  '對方比 3 年前最大的改變?', 'Biggest change in them since 3 yrs ago?',
  null, null, '{cohabit,same_city,long_distance}', true,
  '22222222-2222-2222-2222-222222222222', 1),

('q_ld_timezone_today', 'time', 'multi_choice',
  '今天時差感受?', 'Time zone feel today?',
  '["剛好","錯過彼此","凌晨想念","沒差"]'::jsonb,
  '["In sync","Missed","Late night thoughts","No big deal"]'::jsonb,
  '{long_distance}', true,
  '33333333-3333-3333-3333-333333333333', 1),
('q_ld_video_call_score', 'time', 'slider',
  '今天通話品質滿意度', 'Today''s call quality',
  null, null, '{long_distance}', true,
  '33333333-3333-3333-3333-333333333333', 1),
('q_ld_object_remind', 'observe', 'short_text',
  '今天有什麼讓你想到對方?', 'What reminded you of them today?',
  null, null, '{long_distance}', true,
  '33333333-3333-3333-3333-333333333333', 1),
('q_ld_next_meet_count', 'time', 'guess_partner',
  '猜對方多想下次見面(1–10)', 'Guess how much they miss meeting',
  null, null, '{long_distance}', true,
  '33333333-3333-3333-3333-333333333333', 1),
('q_ld_send_voice', 'interaction', 'multi_choice',
  '今天有交換語音 / 影片嗎?', 'Voice / video shared today?',
  '["有 voice","有 video","只有文字","沒有"]'::jsonb,
  '["Voice","Video","Text only","None"]'::jsonb,
  '{long_distance}', true,
  '33333333-3333-3333-3333-333333333333', 1)
on conflict (id) do nothing;

-- ===== 20260508000002_leaderboard_insight.sql =====
-- howu Phase 3 — leaderboard + monthly insight RPCs

-- ─────────────────────── 排行榜 top N
-- 用 sha256(couple_id) 當匿名 ID,絕不洩漏 couple_id
create or replace function public.leaderboard_top(p_limit int default 50)
returns table(rank int, level int, total_score int, anonymous_id text)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      s.total_score,
      s.level,
      s.couple_id,
      row_number() over (order by s.total_score desc) as r
    from public.sync_scores s
    where coalesce(s.total_score, 0) > 0
  )
  select
    r::int as rank,
    coalesce(level, 1) as level,
    coalesce(total_score, 0) as total_score,
    substring(encode(sha256(couple_id::text::bytea), 'hex') from 1 for 8) as anonymous_id
  from ranked
  order by r
  limit p_limit;
$$;

-- ─────────────────────── 自己 couple 的 rank + percentile
create or replace function public.my_couple_rank(p_couple_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total int;
  v_rank int;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  select count(*) into v_total from public.sync_scores;

  select r into v_rank
  from (
    select couple_id, row_number() over (order by total_score desc) as r
    from public.sync_scores
  ) sub
  where couple_id = p_couple_id;

  if v_rank is null then
    return jsonb_build_object('rank', null, 'percentile', null, 'total_couples', v_total);
  end if;

  return jsonb_build_object(
    'rank', v_rank,
    'percentile', case when v_total > 0
      then ((v_rank::numeric / v_total) * 100)::int
      else 100 end,
    'total_couples', v_total
  );
end;
$$;

grant execute on function public.leaderboard_top(int) to authenticated;
grant execute on function public.my_couple_rank(uuid) to authenticated;

-- ─────────────────────── 月度 insight
create or replace function public.monthly_insight(p_couple_id uuid, p_year int, p_month int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;
  v_days_done int;
  v_sync_delta int;
  v_top_tags jsonb;
  v_best_day jsonb;
  v_avg_happy numeric;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  -- 雙方都完成的日期數
  select count(*) into v_days_done
  from (
    select date
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by date
    having count(distinct responder_id) = 2
  ) sub;

  -- 默契值成長
  select coalesce(sum(delta), 0) into v_sync_delta
  from public.sync_score_events
  where couple_id = p_couple_id and date between v_start and v_end;

  -- 平均幸福
  select coalesce(avg(happiness), 0) into v_avg_happy
  from public.daily_responses
  where couple_id = p_couple_id and date between v_start and v_end;

  -- 最常出現的心情標籤(雙方合計 top 3)
  select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt)), '[]'::jsonb)
    into v_top_tags
  from (
    select unnest(mood_tags) as tag, count(*) as cnt
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by tag
    order by cnt desc
    limit 3
  ) t;

  -- 最佳一天(雙方 happiness + us_overall 加總最高)
  select to_jsonb(t) into v_best_day from (
    select date,
      sum(happiness + us_overall) as score
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by date
    order by score desc
    limit 1
  ) t;

  return jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'days_done', v_days_done,
    'sync_delta', v_sync_delta,
    'top_mood_tags', v_top_tags,
    'best_day', v_best_day,
    'avg_happiness', round(v_avg_happy, 1)
  );
end;
$$;

grant execute on function public.monthly_insight(uuid, int, int) to authenticated;

-- ===== 20260508000003_creator_friends.sql =====
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

commit;
