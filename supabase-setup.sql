-- Breakfast Wheel: shared storage for syncing across devices.
-- Paste this whole file into Supabase → SQL Editor → New query, then click "Run".

-- One row per family. The data column holds the menu, fruits, and history as JSON.
create table if not exists public.breakfast_state (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table down: no direct reads or writes from the app.
alter table public.breakfast_state enable row level security;
revoke all on public.breakfast_state from anon, authenticated;

-- The app can only read or write the row for a family code it already knows.
create or replace function public.get_breakfast(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select data from public.breakfast_state where code = p_code;
$$;

create or replace function public.put_breakfast(p_code text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_code) < 12 then
    raise exception 'family code must be at least 12 characters';
  end if;
  if octet_length(p_data::text) > 500000 then
    raise exception 'data too large';
  end if;
  insert into public.breakfast_state (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on function public.get_breakfast(text) from public;
revoke all on function public.put_breakfast(text, jsonb) from public;
grant execute on function public.get_breakfast(text) to anon, authenticated;
grant execute on function public.put_breakfast(text, jsonb) to anon, authenticated;
