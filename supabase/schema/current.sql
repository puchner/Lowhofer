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
  role text not null default 'member',
  sort_order integer not null default 0,
  avatar_kind text not null default 'generated',
  avatar_style text,
  avatar_seed text,
  avatar_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_gender_check check (gender in ('male', 'female', 'diverse')),
  constraint players_role_check check (role in ('member', 'training_member')),
  constraint players_avatar_kind_check check (avatar_kind in ('generated', 'uploaded'))
);

create table if not exists public.player_positions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  position text not null,
  is_primary boolean not null default false,
  constraint player_positions_position_check check (position in ('setter', 'outside', 'middle', 'opposite', 'libero')),
  constraint player_positions_player_position_unique unique (player_id, position)
);

create table if not exists public.player_update_state (
  player_id uuid primary key references public.players(id) on delete cascade,
  last_seen_update_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);

create table if not exists public.team_settings (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  team_slogan text,
  team_password_hash text not null,
  minimum_yes_players integer not null default 6,
  mixed_minimum_women_on_field integer not null default 2,
  libero_counts_as_full_woman boolean not null default false,
  league_base_url text,
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

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'custom',
  league_game_nr text,
  season_key text,
  team_key text not null default 'lowhofer',
  opponent_name text not null,
  home_away text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_source_type_check check (source_type in ('custom', 'league')),
  constraint matches_home_away_check check (home_away in ('home', 'away', 'unknown'))
);

create table if not exists public.match_appointments (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  starts_at timestamptz,
  has_time boolean not null default true,
  status text not null default 'scheduled',
  location text,
  source_type text not null default 'custom',
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_appointments_status_check check (status in ('planned', 'scheduled', 'cancelled')),
  constraint match_appointments_source_type_check check (source_type in ('custom', 'league')),
  constraint match_appointments_scheduled_requires_start_check check (
    status <> 'scheduled' or starts_at is not null
  ),
  constraint match_appointments_cancelled_at_consistency_check check (
    status = 'cancelled' or cancelled_at is null
  )
);

create table if not exists public.availability_polls (
  id uuid primary key default gen_random_uuid(),
  match_appointment_id uuid not null references public.match_appointments(id) on delete cascade,
  title text not null,
  poll_type text not null,
  poll_status text not null,
  notes text,
  created_by_player_id uuid references public.players(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_polls_poll_type_check check (poll_type in ('match', 'date-finding')),
  constraint availability_polls_poll_status_check check (poll_status in ('open', 'archived', 'cancelled'))
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

create unique index if not exists team_settings_singleton_idx on public.team_settings ((true));
create unique index if not exists players_active_display_name_unique_idx
on public.players (lower(display_name))
where is_active = true;
create index if not exists players_role_active_idx on public.players (role, is_active);
create index if not exists player_positions_player_id_idx on public.player_positions (player_id);
create index if not exists league_cache_expires_at_idx on public.league_cache (expires_at);
create unique index if not exists matches_league_identity_unique_idx
on public.matches (source_type, season_key, team_key, league_game_nr)
where league_game_nr is not null;
create index if not exists match_appointments_match_id_idx on public.match_appointments (match_id);
create index if not exists match_appointments_status_starts_at_idx on public.match_appointments (status, starts_at);
create unique index if not exists match_appointments_one_scheduled_per_match_idx
on public.match_appointments (match_id)
where status = 'scheduled';
create index if not exists availability_polls_match_appointment_id_idx on public.availability_polls (match_appointment_id);
create index if not exists availability_polls_status_idx on public.availability_polls (poll_status, created_at);
create index if not exists availability_responses_poll_id_idx on public.availability_responses (poll_id);
create index if not exists availability_responses_player_id_idx on public.availability_responses (player_id);

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists set_player_update_state_updated_at on public.player_update_state;
create trigger set_player_update_state_updated_at
before update on public.player_update_state
for each row execute function public.set_updated_at();

drop trigger if exists set_team_settings_updated_at on public.team_settings;
create trigger set_team_settings_updated_at
before update on public.team_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists set_match_appointments_updated_at on public.match_appointments;
create trigger set_match_appointments_updated_at
before update on public.match_appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_availability_polls_updated_at on public.availability_polls;
create trigger set_availability_polls_updated_at
before update on public.availability_polls
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.player_positions enable row level security;
alter table public.player_update_state enable row level security;
alter table public.team_settings enable row level security;
alter table public.league_cache enable row level security;
alter table public.matches enable row level security;
alter table public.match_appointments enable row level security;
alter table public.availability_polls enable row level security;
alter table public.availability_responses enable row level security;
