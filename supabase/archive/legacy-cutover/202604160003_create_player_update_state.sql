create table if not exists public.player_update_state (
  player_id uuid primary key references public.players(id) on delete cascade,
  last_seen_update_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);

alter table public.player_update_state enable row level security;

drop trigger if exists set_player_update_state_updated_at on public.player_update_state;
create trigger set_player_update_state_updated_at
before update on public.player_update_state
for each row execute function public.set_updated_at();
