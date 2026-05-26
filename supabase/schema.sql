create extension if not exists pgcrypto;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) between 1 and 300),
  service_url text not null check (service_url ~* '^https?://'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at
before update on public.assignments
for each row
execute function public.set_updated_at();

alter table public.assignments enable row level security;

drop policy if exists "Anyone can read assignments" on public.assignments;
create policy "Anyone can read assignments"
on public.assignments
for select
to anon, authenticated
using (true);

drop policy if exists "School users can insert own assignments" on public.assignments;
create policy "School users can insert own assignments"
on public.assignments
for insert
to authenticated
with check (
  auth.uid() = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) ~ '@([a-z0-9-]+\.)*cnu\.ac\.kr$'
);

drop policy if exists "Owners can update own assignments" on public.assignments;
create policy "Owners can update own assignments"
on public.assignments
for update
to authenticated
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) ~ '@([a-z0-9-]+\.)*cnu\.ac\.kr$'
);

drop policy if exists "Owners can delete own assignments" on public.assignments;
create policy "Owners can delete own assignments"
on public.assignments
for delete
to authenticated
using (auth.uid() = owner_id);

create index if not exists assignments_created_at_idx
on public.assignments (created_at desc);

create index if not exists assignments_owner_id_idx
on public.assignments (owner_id);
