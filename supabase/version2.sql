begin;

create extension if not exists pgcrypto;

-- Todo list: database-backed and private to each authenticated user.
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todos_user_id_created_at_idx
on public.todos (user_id, created_at desc);

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

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

alter table public.todos enable row level security;

grant select, insert, update, delete on public.todos to authenticated;

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

-- Move existing learning cards from the old IT/Other taxonomy.
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

commit;
