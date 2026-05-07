-- howu (CoupleCheck) 初始 schema
-- 對應 CLAUDE.md §4.1。RLS 政策見 20260507000001_rls_policies.sql。

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ───────────────────────────── profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  birthday date,
  locale text default 'zh-TW' check (locale in ('zh-TW', 'en')),
  emoji_pack jsonb default '[]'::jsonb,
  is_premium boolean default false,
  premium_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ───────────────────────────── couples
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  partner_a_id uuid references public.profiles(id) on delete cascade,
  partner_b_id uuid references public.profiles(id) on delete cascade,
  paired_at timestamptz default now(),
  together_since date not null,
  relationship_type text check (relationship_type in ('cohabit', 'same_city', 'long_distance')),
  status text default 'active' check (status in ('active', 'paused', 'disconnected', 'recovery')),
  paused_at timestamptz,
  disconnected_at timestamptz,
  recovery_until timestamptz,
  unique (partner_a_id, partner_b_id)
);

create index idx_couples_partner_a on public.couples(partner_a_id);
create index idx_couples_partner_b on public.couples(partner_b_id);
create index idx_couples_status on public.couples(status);

-- ───────────────────────────── invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references public.profiles(id) on delete cascade,
  token text unique not null,
  message text,
  message_style text check (message_style in ('cute', 'simple', 'custom')),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  accepted_by_id uuid references public.profiles(id),
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_inviter on public.invitations(inviter_id);

-- ───────────────────────────── question_packs (必須先於 questions)
create table public.question_packs (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text,
  description_zh text,
  creator_id uuid references public.profiles(id),
  type text check (type in ('official', 'seasonal', 'creator', 'user_custom')),
  price_twd int default 0,
  is_premium_included boolean default false,
  cover_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- ───────────────────────────── questions (輪換題庫)
create table public.questions (
  id text primary key,
  category text not null check (category in ('interaction', 'observe', 'intimacy', 'gratitude', 'time', 'open')),
  type text not null check (type in ('slider', 'multi_choice', 'short_text', 'guess_partner')),
  text_zh text not null,
  text_en text not null,
  options_zh jsonb,
  options_en jsonb,
  for_relationship_types text[] default '{cohabit,same_city,long_distance}',
  is_premium boolean default false,
  pack_id uuid references public.question_packs(id),
  weight int default 1
);

create index idx_questions_category on public.questions(category);
create index idx_questions_pack on public.questions(pack_id);

-- ───────────────────────────── daily_responses
create table public.daily_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  responder_id uuid references public.profiles(id) on delete cascade,
  date date not null,

  happiness int check (happiness between 1 and 10),
  energy int check (energy between 1 and 10),
  stress int check (stress between 1 and 10),
  miss_partner int check (miss_partner between 1 and 10),
  us_overall int check (us_overall between 1 and 10),

  rotating_answers jsonb not null default '[]'::jsonb,

  mood_tags text[] default '{}',

  secret_message text,
  secret_delivery_mode text check (secret_delivery_mode in ('immediate', 'tomorrow', 'scheduled', 'private')),
  secret_delivery_at timestamptz,
  secret_read_at timestamptz,
  secret_archived boolean default false,

  completed_at timestamptz default now(),
  unique (couple_id, responder_id, date)
);

create index idx_daily_responses_couple_date on public.daily_responses(couple_id, date);
create index idx_daily_responses_responder on public.daily_responses(responder_id);

-- ───────────────────────────── sync_scores / sync_score_events
create table public.sync_scores (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  total_score int default 0,
  level int default 1,
  last_calculated_at timestamptz default now(),
  cooled_down boolean default false
);

create table public.sync_score_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  date date not null,
  source text not null,
  source_detail jsonb,
  delta int not null,
  created_at timestamptz default now()
);

create index idx_sync_events_couple_date on public.sync_score_events(couple_id, date);

-- ───────────────────────────── four_grid_responses
create table public.four_grid_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  responder_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  theme text not null,
  selected_index int check (selected_index between 0 and 3),
  custom_photo_url text,
  custom_photo_category text,
  created_at timestamptz default now(),
  unique (couple_id, responder_id, date)
);

-- ───────────────────────────── journal_entries (個人日記)
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  content text,
  attached_response_id uuid references public.daily_responses(id),
  shared_with_partner boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_journal_user_date on public.journal_entries(user_id, date);

-- ───────────────────────────── milestones
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  date date not null,
  type text check (type in ('anniversary', 'first_meet', 'first_trip', 'birthday_a', 'birthday_b', 'custom')),
  recurring boolean default true,
  created_at timestamptz default now()
);

create index idx_milestones_couple on public.milestones(couple_id);

-- ───────────────────────────── shared_photos
create table public.shared_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  uploader_id uuid references public.profiles(id) on delete cascade,
  url text not null,
  caption text,
  taken_at date,
  created_at timestamptz default now()
);

create index idx_shared_photos_couple on public.shared_photos(couple_id);

-- ───────────────────────────── promises (原「懲罰系統」改名)
create table public.promises (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  text_zh text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- ───────────────────────────── subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  provider text check (provider in ('stripe', 'line_pay', 'jkopay')),
  provider_subscription_id text,
  status text check (status in ('active', 'cancelled', 'past_due', 'expired')),
  plan text check (plan in ('monthly', 'yearly')),
  amount_twd int,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

create index idx_subscriptions_user on public.subscriptions(user_id);

-- ───────────────────────────── orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id),
  items jsonb not null,
  total_twd int not null,
  shipping_address jsonb,
  status text check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number text,
  expedited boolean default false,
  created_at timestamptz default now()
);

create index idx_orders_user on public.orders(user_id);

-- ───────────────────────────── push_subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_push_user on public.push_subscriptions(user_id);
