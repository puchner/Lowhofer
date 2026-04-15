create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  gender text not null,
  is_active boolean not null default true,
  is_admin boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_gender_check check (gender in ('male', 'female', 'diverse'))
);

create table if not exists public.player_positions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  position text not null,
  is_primary boolean not null default false,
  constraint player_positions_position_check check (position in ('setter', 'outside', 'middle', 'opposite', 'libero')),
  constraint player_positions_player_position_unique unique (player_id, position)
);

create table if not exists public.availability_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  poll_type text not null,
  poll_status text not null,
  starts_at timestamptz,
  location text,
  home_away text not null,
  opponent_name text,
  notes text,
  source_type text not null default 'custom',
  league_fixture_external_id text,
  created_by_player_id uuid references public.players(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_polls_poll_type_check check (poll_type in ('match', 'date-finding')),
  constraint availability_polls_poll_status_check check (poll_status in ('open', 'archived', 'cancelled')),
  constraint availability_polls_home_away_check check (home_away in ('home', 'away', 'unknown')),
  constraint availability_polls_source_type_check check (source_type in ('custom', 'league'))
);

create table if not exists public.availability_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.availability_polls(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null,
  comment text,
  updated_at timestamptz not null default now(),
  constraint availability_responses_status_check check (status in ('available', 'unavailable', 'maybe', 'unknown')),
  constraint availability_responses_poll_player_unique unique (poll_id, player_id)
);

create table if not exists public.team_settings (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  team_slogan text,
  team_password_hash text not null,
  minimum_yes_players integer not null default 6,
  mixed_minimum_women_on_field integer not null default 2,
  libero_counts_as_full_woman boolean not null default false,
  league_table_url text,
  league_fixtures_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_settings_minimum_yes_players_check check (minimum_yes_players >= 0),
  constraint team_settings_mixed_minimum_women_on_field_check check (mixed_minimum_women_on_field >= 0)
);

create table if not exists public.league_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  payload_json jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz not null,
  source_url text not null,
  etag text,
  last_modified text,
  constraint league_cache_cache_key_check check (cache_key in ('table', 'fixtures'))
);

create unique index if not exists team_settings_singleton_idx on public.team_settings ((true));
create index if not exists player_positions_player_id_idx on public.player_positions (player_id);
create index if not exists availability_polls_status_starts_at_idx on public.availability_polls (poll_status, starts_at);
create index if not exists availability_responses_poll_id_idx on public.availability_responses (poll_id);
create index if not exists availability_responses_player_id_idx on public.availability_responses (player_id);
create index if not exists league_cache_expires_at_idx on public.league_cache (expires_at);

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists set_availability_polls_updated_at on public.availability_polls;
create trigger set_availability_polls_updated_at
before update on public.availability_polls
for each row execute function public.set_updated_at();

drop trigger if exists set_team_settings_updated_at on public.team_settings;
create trigger set_team_settings_updated_at
before update on public.team_settings
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.player_positions enable row level security;
alter table public.availability_polls enable row level security;
alter table public.availability_responses enable row level security;
alter table public.team_settings enable row level security;
alter table public.league_cache enable row level security;
