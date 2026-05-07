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
