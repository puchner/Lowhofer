-- Kalender-/Terminmodell: stabile Matches und konkrete oder geplante Termine.
-- Diese Migration ist bewusst additiv. Legacy-Felder in availability_polls bleiben
-- erhalten, damit der Cutover lokal gegen einen Produktiv-Snapshot validiert werden kann.

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'custom',
  league_game_nr text,
  season_key text,
  team_key text,
  opponent_name text not null,
  home_away text not null,
  notes text,
  legacy_poll_id uuid references public.availability_polls(id) on delete set null,
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
  legacy_poll_id uuid references public.availability_polls(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_appointments_status_check check (status in ('planned', 'scheduled', 'cancelled')),
  constraint match_appointments_source_type_check check (source_type in ('custom', 'league'))
);

alter table public.availability_polls
  add column if not exists match_appointment_id uuid references public.match_appointments(id) on delete set null;

create unique index if not exists matches_league_identity_unique_idx
on public.matches (source_type, season_key, team_key, league_game_nr)
where league_game_nr is not null;

create unique index if not exists matches_legacy_poll_unique_idx
on public.matches (legacy_poll_id)
where legacy_poll_id is not null;

create unique index if not exists match_appointments_legacy_poll_unique_idx
on public.match_appointments (legacy_poll_id)
where legacy_poll_id is not null;

create index if not exists match_appointments_match_id_idx on public.match_appointments (match_id);
create index if not exists match_appointments_status_starts_at_idx on public.match_appointments (status, starts_at);
create index if not exists availability_polls_match_appointment_id_idx on public.availability_polls (match_appointment_id);

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists set_match_appointments_updated_at on public.match_appointments;
create trigger set_match_appointments_updated_at
before update on public.match_appointments
for each row execute function public.set_updated_at();

alter table public.matches enable row level security;
alter table public.match_appointments enable row level security;

-- League-Polls mit gleicher GameNr gehoeren zum selben stabilen Match.
with league_context as (
  select
    coalesce(nullif(substring(coalesce(league_base_url, '') from '/saison/([0-9]+)'), ''), 'unknown') as season_key,
    'lowhofer'::text as team_key
  from public.team_settings
  limit 1
),
league_polls as (
  select distinct on (p.source_type, p.league_fixture_external_id)
    p.source_type,
    p.league_fixture_external_id,
    coalesce(nullif(p.opponent_name, ''), p.title, 'Unbekannt') as opponent_name,
    p.home_away,
    p.created_at,
    p.updated_at,
    coalesce((select season_key from league_context), 'unknown') as season_key,
    coalesce((select team_key from league_context), 'lowhofer') as team_key
  from public.availability_polls p
  where p.league_fixture_external_id is not null
  order by p.source_type, p.league_fixture_external_id, p.created_at
)
insert into public.matches (
  source_type,
  league_game_nr,
  season_key,
  team_key,
  opponent_name,
  home_away,
  created_at,
  updated_at
)
select
  source_type,
  league_fixture_external_id,
  season_key,
  team_key,
  opponent_name,
  home_away,
  created_at,
  updated_at
from league_polls
on conflict (source_type, season_key, team_key, league_game_nr)
where league_game_nr is not null
do update
set opponent_name = excluded.opponent_name,
    home_away = excluded.home_away,
    updated_at = greatest(public.matches.updated_at, excluded.updated_at);

-- Custom-/Legacy-Polls ohne GameNr bekommen bewusst ein eigenes Match pro Poll.
insert into public.matches (
  source_type,
  legacy_poll_id,
  season_key,
  team_key,
  opponent_name,
  home_away,
  created_at,
  updated_at
)
select
  'custom',
  p.id,
  null,
  'lowhofer',
  coalesce(nullif(p.opponent_name, ''), p.title, 'Unbekannt'),
  p.home_away,
  p.created_at,
  p.updated_at
from public.availability_polls p
where p.league_fixture_external_id is null
on conflict (legacy_poll_id)
where legacy_poll_id is not null
do update
set opponent_name = excluded.opponent_name,
    home_away = excluded.home_away,
    updated_at = greatest(public.matches.updated_at, excluded.updated_at);

-- Jede bestehende Poll erhaelt genau einen Appointment. Responses bleiben ueber
-- poll_id stabil und muessen nicht verschoben werden.
with league_context as (
  select
    coalesce(nullif(substring(coalesce(league_base_url, '') from '/saison/([0-9]+)'), ''), 'unknown') as season_key,
    'lowhofer'::text as team_key
  from public.team_settings
  limit 1
),
poll_matches as (
  select
    p.id as poll_id,
    p.starts_at,
    p.location,
    p.source_type,
    p.poll_type,
    p.poll_status,
    p.created_at,
    p.updated_at,
    m.id as match_id
  from public.availability_polls p
  join public.matches m
    on (
      p.league_fixture_external_id is not null
      and m.source_type = p.source_type
      and m.league_game_nr = p.league_fixture_external_id
      and m.season_key = coalesce((select season_key from league_context), 'unknown')
      and m.team_key = coalesce((select team_key from league_context), 'lowhofer')
    )
    or (
      p.league_fixture_external_id is null
      and m.legacy_poll_id = p.id
    )
)
insert into public.match_appointments (
  match_id,
  starts_at,
  has_time,
  status,
  location,
  source_type,
  cancelled_at,
  legacy_poll_id,
  created_at,
  updated_at
)
select
  match_id,
  starts_at,
  case
    when starts_at is null then false
    when to_char(starts_at at time zone 'Europe/Berlin', 'HH24:MI') = '00:00' then false
    else true
  end as has_time,
  case
    when poll_status = 'cancelled' then 'cancelled'
    when poll_type = 'date-finding' then 'planned'
    else 'scheduled'
  end as status,
  location,
  source_type,
  case when poll_status = 'cancelled' then updated_at else null end as cancelled_at,
  poll_id,
  created_at,
  updated_at
from poll_matches
on conflict (legacy_poll_id)
where legacy_poll_id is not null
do update
set starts_at = excluded.starts_at,
    has_time = excluded.has_time,
    status = excluded.status,
    location = excluded.location,
    source_type = excluded.source_type,
    cancelled_at = excluded.cancelled_at,
    updated_at = greatest(public.match_appointments.updated_at, excluded.updated_at);

update public.availability_polls p
set match_appointment_id = a.id
from public.match_appointments a
where a.legacy_poll_id = p.id
  and p.match_appointment_id is null;
