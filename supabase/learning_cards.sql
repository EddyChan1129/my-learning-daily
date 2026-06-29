create table if not exists public.learning_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  category text not null,
  summary text not null,
  content text not null,
  learned_date date not null,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  description text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
on public.profiles for select
using (true);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

alter table public.learning_cards enable row level security;

create policy "Anyone can view learning cards"
on public.learning_cards for select
using (true);

create policy "Authenticated users can insert own learning cards"
on public.learning_cards for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Owners can update own learning cards"
on public.learning_cards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete own learning cards"
on public.learning_cards for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_learning_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_learning_cards_updated_at on public.learning_cards;

create trigger set_learning_cards_updated_at
before update on public.learning_cards
for each row
execute function public.set_learning_cards_updated_at();

create table if not exists public.learning_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.learning_cards(id) on delete cascade,
  author_name text not null default '訪客',
  body text not null,
  viod boolean not null default false,
  created_at timestamptz default now()
);

alter table public.learning_comments
add column if not exists viod boolean not null default false;

alter table public.learning_comments enable row level security;

create policy "Anyone can view learning comments"
on public.learning_comments for select
using (true);

create policy "Anyone can insert learning comments"
on public.learning_comments for insert
with check (
  length(trim(author_name)) between 1 and 40
  and length(trim(body)) between 1 and 1000
);

drop policy if exists "Authenticated users can delete learning comments"
on public.learning_comments;

create policy "Authenticated users can mark learning comments deleted"
on public.learning_comments for update
to authenticated
using (true)
with check (viod = true);
