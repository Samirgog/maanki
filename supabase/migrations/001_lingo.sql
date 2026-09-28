-- Run this file in Supabase Dashboard -> SQL Editor.
-- Also enable Authentication -> Providers -> Anonymous sign-ins.

create table if not exists public.cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id bigint not null,
  word text not null,
  translation text not null,
  example text not null default '',
  level text not null default 'A1',
  interval integer not null default 1,
  due boolean not null default true,
  tag text not null default 'General',
  phonetic text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

alter table public.cards enable row level security;

create policy "Users can read their own cards"
  on public.cards for select using (auth.uid() = user_id);

create policy "Users can insert their own cards"
  on public.cards for insert with check (auth.uid() = user_id);

create policy "Users can update their own cards"
  on public.cards for update using (auth.uid() = user_id);

create policy "Users can delete their own cards"
  on public.cards for delete using (auth.uid() = user_id);

create or replace function public.set_cards_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists cards_updated_at on public.cards;
create trigger cards_updated_at before update on public.cards
for each row execute procedure public.set_cards_updated_at();

-- Optional starter content for a specific anonymous user is intentionally not included.
-- The app creates and syncs a user's cards after anonymous auth is enabled.
