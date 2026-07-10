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

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 500),
  completed boolean not null default false,
  priority smallint not null default 3 check (priority between 1 and 4),
  estimated_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Foreign-key indexes are not created automatically by PostgreSQL.
create index if not exists learning_cards_user_id_idx
on public.learning_cards (user_id);

create index if not exists learning_comments_card_id_idx
on public.learning_comments (card_id);

create index if not exists todos_user_id_created_at_idx
on public.todos (user_id, created_at desc);

create index if not exists todos_user_id_priority_due_date_idx
on public.todos (user_id, priority, estimated_completion_date);

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------

update public.learning_cards
set
  category = case sub_field
    when 'leetcode' then '技術實戰'
    when 'javascript' then '技術實戰'
    when 'springboot' then '技術實戰'
    when 'security' then '技術實戰'
    when 'networking' then '技術實戰'
    when 'working issues' then 'Programmer 日常'
    when 'interview question' then 'Programmer 日常'
    else '作品與想法'
  end,
  sub_field = case sub_field
    when 'leetcode' then 'coding'
    when 'javascript' then 'coding'
    when 'springboot' then 'backend'
    when 'security' then 'architecture'
    when 'networking' then 'architecture'
    when 'working issues' then 'debugging'
    when 'interview question' then 'career'
    else 'thoughts'
  end
where sub_field in (
  'leetcode',
  'javascript',
  'springboot',
  'interview question',
  'security',
  'networking',
  'working issues',
  'other'
);

delete from public.categories
where id in (
  'leetcode',
  'javascript',
  'springboot',
  'interview question',
  'security',
  'networking',
  'working issues',
  'other'
);

insert into public.categories (id, category, name, sort_order)
values
  ('coding', '技術實戰', 'Coding / 程式開發', 1),
  ('backend', '技術實戰', 'Backend / API', 2),
  ('database', '技術實戰', 'Database / 資料庫', 3),
  ('architecture', '技術實戰', 'System Design / 架構', 4),
  ('devops', '技術實戰', 'DevOps / 部署', 5),
  ('ai-tools', '技術實戰', 'AI / 開發工具', 6),
  ('debugging', 'Programmer 日常', 'Debug / 踩坑紀錄', 7),
  ('practical-tips', 'Programmer 日常', '實用技巧', 8),
  ('work-life', 'Programmer 日常', 'Programmer 工作日常', 9),
  ('career', 'Programmer 日常', '職涯 / 面試', 10),
  ('teamwork', 'Programmer 日常', '團隊協作', 11),
  ('side-project', '作品與想法', 'Side Project', 12),
  ('resources', '作品與想法', '資源分享', 13),
  ('thoughts', '作品與想法', '隨筆 / 其他', 14)
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

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.learning_cards enable row level security;
alter table public.learning_comments enable row level security;
alter table public.todos enable row level security;

-- Table privileges are checked before row-level security policies.
grant select on public.categories, public.profiles, public.learning_cards,
  public.learning_comments to anon, authenticated;
grant insert on public.learning_comments to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.learning_cards to authenticated;
grant update on public.learning_comments to authenticated;
grant select, insert, update, delete on public.todos to authenticated;

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

drop policy if exists "Users can view own todos" on public.todos;
create policy "Users can view own todos"
on public.todos
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own todos" on public.todos;
create policy "Users can insert own todos"
on public.todos
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own todos" on public.todos;
create policy "Users can update own todos"
on public.todos
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own todos" on public.todos;
create policy "Users can delete own todos"
on public.todos
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
