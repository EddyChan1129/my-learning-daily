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
