begin;

alter table public.todos
add column if not exists priority smallint;

alter table public.todos
add column if not exists estimated_completion_date date;

update public.todos
set priority = 3
where priority is null;

alter table public.todos
alter column priority set default 3,
alter column priority set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.todos'::regclass
      and conname = 'todos_priority_check'
  ) then
    alter table public.todos
    add constraint todos_priority_check check (priority between 1 and 4);
  end if;
end;
$$;

create index if not exists todos_user_id_priority_due_date_idx
on public.todos (user_id, priority, estimated_completion_date);

commit;
