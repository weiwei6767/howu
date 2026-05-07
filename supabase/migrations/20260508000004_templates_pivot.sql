-- howu Pivot — 從固定問卷 + 默契值 改成「使用者自製模板 + A/B 輪流選」
-- 不刪舊 schema(資料留著),只新增需要的 table + 停用 sync trigger。

-- ═══════════════════════════ 新 tables

-- 1) 問卷模板(每對 couple 自己建)
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  name text not null,
  description text,
  emoji text default '📝',
  created_by uuid references public.profiles(id) on delete set null,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_templates_couple on public.templates(couple_id);

-- 2) 模板裡的題目
create table if not exists public.template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.templates(id) on delete cascade,
  position int not null default 0,
  type text not null check (type in ('slider', 'multi_choice', 'short_text', 'guess_partner', 'mood_tags')),
  text text not null,
  options jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_template_questions_template on public.template_questions(template_id);

-- 3) 模板承諾(每份模板可以有自己的承諾)
create table if not exists public.template_promises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.templates(id) on delete cascade,
  position int not null default 0,
  text text not null,
  created_at timestamptz default now()
);

create index if not exists idx_template_promises_template on public.template_promises(template_id);

-- 4) 每天 couple 選的模板(A/B 輪流)
create table if not exists public.daily_template_picks (
  couple_id uuid references public.couples(id) on delete cascade,
  date date not null,
  template_id uuid references public.templates(id) on delete set null,
  picked_by uuid references public.profiles(id) on delete set null,
  picked_at timestamptz default now(),
  primary key (couple_id, date)
);

-- 5) daily_responses 加 template_id 欄位
alter table public.daily_responses
  add column if not exists template_id uuid references public.templates(id) on delete set null;

create index if not exists idx_daily_responses_template on public.daily_responses(template_id);

-- ═══════════════════════════ RLS

alter table public.templates enable row level security;
alter table public.template_questions enable row level security;
alter table public.template_promises enable row level security;
alter table public.daily_template_picks enable row level security;

drop policy if exists "templates_member_all" on public.templates;
create policy "templates_member_all" on public.templates
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "template_questions_member_all" on public.template_questions;
create policy "template_questions_member_all" on public.template_questions
  for all
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_questions.template_id
        and public.is_couple_member(t.couple_id)
    )
  )
  with check (
    exists (
      select 1 from public.templates t
      where t.id = template_questions.template_id
        and public.is_couple_member(t.couple_id)
    )
  );

drop policy if exists "template_promises_member_all" on public.template_promises;
create policy "template_promises_member_all" on public.template_promises
  for all
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_promises.template_id
        and public.is_couple_member(t.couple_id)
    )
  )
  with check (
    exists (
      select 1 from public.templates t
      where t.id = template_promises.template_id
        and public.is_couple_member(t.couple_id)
    )
  );

drop policy if exists "daily_picks_member_read" on public.daily_template_picks;
create policy "daily_picks_member_read" on public.daily_template_picks
  for select using (public.is_couple_member(couple_id));

-- 寫入由 RPC 處理(避免亂改別人的 pick)

-- ═══════════════════════════ RPC

-- next_picker:依昨天誰選 → 今天輪另一個。第一次預設 partner_a。
create or replace function public.next_picker(p_couple_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
  v_last_picker uuid;
begin
  select partner_a_id, partner_b_id into v_a, v_b
  from public.couples
  where id = p_couple_id and status = 'active';
  if v_a is null then return null; end if;

  select picked_by into v_last_picker
  from public.daily_template_picks
  where couple_id = p_couple_id
  order by date desc
  limit 1;

  if v_last_picker is null then return v_a; end if;
  if v_last_picker = v_a then return v_b; end if;
  return v_a;
end;
$$;

-- pick_template:當輪到的 user pick template,寫入 daily_template_picks
create or replace function public.pick_template(p_couple_id uuid, p_template_id uuid, p_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_next uuid;
  v_template_couple uuid;
  v_existing_picker uuid;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  -- 模板必須是這對 couple 自己的
  select couple_id into v_template_couple from public.templates where id = p_template_id;
  if v_template_couple is null or v_template_couple <> p_couple_id then
    raise exception 'template_not_yours';
  end if;

  -- 看今天是否已有 pick;有的話只允許原 picker 改
  select picked_by into v_existing_picker
  from public.daily_template_picks
  where couple_id = p_couple_id and date = p_date;

  if v_existing_picker is null then
    -- 第一次 pick → 必須是輪到的人
    v_next := public.next_picker(p_couple_id);
    if v_uid <> v_next then
      raise exception 'not_your_turn';
    end if;
  else
    -- 已 pick → 只允許原 picker 改
    if v_uid <> v_existing_picker then
      raise exception 'pick_locked';
    end if;
  end if;

  insert into public.daily_template_picks (couple_id, date, template_id, picked_by, picked_at)
  values (p_couple_id, p_date, p_template_id, v_uid, now())
  on conflict (couple_id, date) do update
    set template_id = excluded.template_id, picked_at = excluded.picked_at;

  return jsonb_build_object('template_id', p_template_id, 'date', p_date, 'picked_by', v_uid);
end;
$$;

grant execute on function public.next_picker(uuid) to authenticated;
grant execute on function public.pick_template(uuid, uuid, date) to authenticated;

-- ═══════════════════════════ Starter templates trigger
-- 新 couple 建立時自動產 3 份起手模板,讓他們不會空白。

create or replace function public.create_starter_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t1 uuid;
  v_t2 uuid;
  v_t3 uuid;
begin
  -- 1) 每日心情(5 題快速)
  insert into public.templates (couple_id, name, emoji, description, created_by)
  values (new.id, '每日心情(5 分鐘版)', '☀️', '快速版,寫起來不負擔', new.partner_a_id)
  returning id into v_t1;

  insert into public.template_questions (template_id, position, type, text, options) values
    (v_t1, 0, 'slider', '今日幸福程度', null),
    (v_t1, 1, 'slider', '今天累的程度', null),
    (v_t1, 2, 'mood_tags', '今天的心情', null),
    (v_t1, 3, 'short_text', '今天最想對對方說的一句話', null),
    (v_t1, 4, 'guess_partner', '猜對方今天的幸福分數', null);

  insert into public.template_promises (template_id, position, text) values
    (v_t1, 0, '寫完今日問卷再睡'),
    (v_t1, 1, '看到對方寫的會回應一句');

  -- 2) 深度版(8 題)
  insert into public.templates (couple_id, name, emoji, description, created_by)
  values (new.id, '深度日(週末用)', '🌿', '想停下來好好聊的時候用', new.partner_a_id)
  returning id into v_t2;

  insert into public.template_questions (template_id, position, type, text, options) values
    (v_t2, 0, 'slider', '今天我們關係的感覺', null),
    (v_t2, 1, 'short_text', '今天最讓我感謝對方的一件事', null),
    (v_t2, 2, 'short_text', '今天最印象深刻的一個瞬間', null),
    (v_t2, 3, 'multi_choice', '今天主要做了哪件事?', '["休息充電","跟朋友見面","認真工作","跑外面","跟對方一起"]'::jsonb),
    (v_t2, 4, 'guess_partner', '猜對方今天的累指數', null),
    (v_t2, 5, 'short_text', '希望明天能跟對方一起做的事', null);

  insert into public.template_promises (template_id, position, text) values
    (v_t2, 0, '看完對方答案不立刻分析,先深呼吸');

  -- 3) 「對方今天怎麼了」版(5 題)
  insert into public.templates (couple_id, name, emoji, description, created_by)
  values (new.id, '今天對方怎麼了', '👀', '純觀察題,訓練看見對方', new.partner_a_id)
  returning id into v_t3;

  insert into public.template_questions (template_id, position, type, text, options) values
    (v_t3, 0, 'guess_partner', '猜對方今天的幸福程度', null),
    (v_t3, 1, 'guess_partner', '猜對方今天的累指數', null),
    (v_t3, 2, 'short_text', '今天看到對方做了什麼讓你心動?', null),
    (v_t3, 3, 'multi_choice', '對方今天的氣場?', '["陽光","冷靜","煩躁","若有所思","平淡"]'::jsonb),
    (v_t3, 4, 'short_text', '今天對方的一句話讓你印象深?', null);

  return new;
end;
$$;

drop trigger if exists couples_create_starter_templates on public.couples;
create trigger couples_create_starter_templates
  after insert on public.couples
  for each row execute function public.create_starter_templates();

-- ═══════════════════════════ 停用 sync_scores 自動更新
-- (Pivot 後不再依賴 sync,但保留 schema)

drop trigger if exists subscriptions_sync_profile on public.subscriptions;
