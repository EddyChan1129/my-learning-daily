begin;

-- Required by gen_random_uuid().
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.categories (
  id text primary key,
  category text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  description text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_cards (
  id uuid primary key default gen_random_uuid(),
  cloud_id text unique,
  slug text unique,
  title text not null,
  category text not null,
  sub_field text,
  summary text not null,
  content text not null,
  learned_date date not null,
  image_url text,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.learning_cards(id) on delete cascade,
  author_name text not null default '訪客',
  body text not null,
  -- Kept as "viod" because the application already uses this field name.
  viod boolean not null default false,
  created_at timestamptz not null default now()
);

-- Foreign-key indexes are not created automatically by PostgreSQL.
create index if not exists learning_cards_user_id_idx
on public.learning_cards (user_id);

create index if not exists learning_comments_card_id_idx
on public.learning_comments (card_id);

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------

insert into public.categories (id, category, name, sort_order)
values
  ('leetcode', 'IT', 'leetcode', 1),
  ('javascript', 'IT', 'javascript', 2),
  ('springboot', 'IT', 'springboot', 3),
  ('interview question', 'IT', 'interview question', 4),
  ('security', 'IT', 'security', 5),
  ('networking', 'IT', 'networking', 6),
  ('working issues', 'IT', 'working issues', 7),
  ('other', 'Other', 'other', 1)
on conflict (id) do update
set
  category = excluded.category,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Automatically maintain updated_at
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_learning_cards_updated_at on public.learning_cards;
create trigger set_learning_cards_updated_at
before update on public.learning_cards
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.learning_cards enable row level security;
alter table public.learning_comments enable row level security;

drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories"
on public.categories
for select
using (true);

drop policy if exists "Anyone can view profiles" on public.profiles;
create policy "Anyone can view profiles"
on public.profiles
for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Anyone can view learning cards" on public.learning_cards;
create policy "Anyone can view learning cards"
on public.learning_cards
for select
using (true);

drop policy if exists "Authenticated users can insert own learning cards"
on public.learning_cards;
create policy "Authenticated users can insert own learning cards"
on public.learning_cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update own learning cards"
on public.learning_cards;
create policy "Owners can update own learning cards"
on public.learning_cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete own learning cards"
on public.learning_cards;
create policy "Owners can delete own learning cards"
on public.learning_cards
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view learning comments"
on public.learning_comments;
create policy "Anyone can view learning comments"
on public.learning_comments
for select
using (true);

drop policy if exists "Anyone can insert learning comments"
on public.learning_comments;
create policy "Anyone can insert learning comments"
on public.learning_comments
for insert
with check (
  length(trim(author_name)) between 1 and 40
  and length(trim(body)) between 1 and 1000
);

drop policy if exists "Authenticated users can mark learning comments deleted"
on public.learning_comments;
create policy "Authenticated users can mark learning comments deleted"
on public.learning_comments
for update
to authenticated
using (true)
with check (viod = true);

commit;
