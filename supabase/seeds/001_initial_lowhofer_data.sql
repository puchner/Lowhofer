-- Initial MVP seed derived from src/data/mockPlayers.ts and src/data/mockMatchDays.ts.
-- Before production use, replace team_password_hash with the hash generated in Paket 3.
-- Pia and Volker are initial trusted admins.

insert into public.players (id, display_name, gender, is_active, is_admin, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Pia', 'female', true, true, 10),
  ('00000000-0000-4000-8000-000000000002', 'Nina', 'female', true, false, 20),
  ('00000000-0000-4000-8000-000000000003', 'Dani', 'female', true, false, 30),
  ('00000000-0000-4000-8000-000000000004', 'Caro', 'female', true, false, 40),
  ('00000000-0000-4000-8000-000000000005', 'Linda', 'female', true, false, 50),
  ('00000000-0000-4000-8000-000000000006', 'Ina', 'female', true, false, 60),
  ('00000000-0000-4000-8000-000000000007', 'Andi', 'male', true, false, 70),
  ('00000000-0000-4000-8000-000000000008', 'Lars', 'male', true, false, 80),
  ('00000000-0000-4000-8000-000000000009', 'Stefan', 'male', true, false, 90),
  ('00000000-0000-4000-8000-000000000010', 'Volker', 'male', true, true, 100),
  ('00000000-0000-4000-8000-000000000011', 'Michi', 'male', true, false, 110),
  ('00000000-0000-4000-8000-000000000012', 'Fran', 'male', true, false, 120),
  ('00000000-0000-4000-8000-000000000013', 'Heli', 'male', true, false, 130)
on conflict (id) do update
set display_name = excluded.display_name,
    gender = excluded.gender,
    is_active = excluded.is_active,
    is_admin = excluded.is_admin,
    sort_order = excluded.sort_order;

with player_positions_seed (player_id, position, is_primary) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'middle', true),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'opposite', false),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'outside', false),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'opposite', true),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'setter', true),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'outside', false),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'opposite', true),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'libero', false),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'setter', true),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'libero', true),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'middle', false),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'setter', false),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'outside', true),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'opposite', false),
    ('00000000-0000-4000-8000-000000000008'::uuid, 'outside', true),
    ('00000000-0000-4000-8000-000000000008'::uuid, 'opposite', false),
    ('00000000-0000-4000-8000-000000000009'::uuid, 'middle', false),
    ('00000000-0000-4000-8000-000000000009'::uuid, 'outside', true),
    ('00000000-0000-4000-8000-000000000010'::uuid, 'middle', true),
    ('00000000-0000-4000-8000-000000000011'::uuid, 'outside', false),
    ('00000000-0000-4000-8000-000000000011'::uuid, 'middle', true),
    ('00000000-0000-4000-8000-000000000012'::uuid, 'middle', true),
    ('00000000-0000-4000-8000-000000000013'::uuid, 'middle', true)
)
insert into public.player_positions (player_id, position, is_primary)
select player_id, position, is_primary
from player_positions_seed
on conflict (player_id, position) do update
set is_primary = excluded.is_primary;

insert into public.availability_polls (
  id,
  title,
  poll_type,
  poll_status,
  starts_at,
  location,
  home_away,
  opponent_name,
  source_type,
  league_fixture_external_id,
  archived_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'ESV Freimann',
    'match',
    'open',
    '2026-04-20 20:00:00 Europe/Berlin',
    'Lowhofer Heimspiel',
    'home',
    'ESV Freimann',
    'league',
    '56',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Forza Ragazzi',
    'match',
    'open',
    '2026-04-23 18:45:00 Europe/Berlin',
    'Forza Ragazzi',
    'away',
    'Forza Ragazzi',
    'custom',
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'To The Top!',
    'match',
    'archived',
    '2026-04-13 20:00:00 Europe/Berlin',
    'Lowhofer Heimspiel',
    'home',
    'To The Top!',
    'custom',
    null,
    '2026-04-14 00:00:00 Europe/Berlin'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'Loud''n''Proud Terminfindung',
    'date-finding',
    'open',
    '2026-05-01 00:00:00 Europe/Berlin',
    'Termin laut Liga noch unbestimmt',
    'home',
    'Loud''n''Proud',
    'custom',
    null,
    null
  )
on conflict (id) do update
set title = excluded.title,
    poll_type = excluded.poll_type,
    poll_status = excluded.poll_status,
    starts_at = excluded.starts_at,
    location = excluded.location,
    home_away = excluded.home_away,
    opponent_name = excluded.opponent_name,
    source_type = excluded.source_type,
    league_fixture_external_id = excluded.league_fixture_external_id,
    archived_at = excluded.archived_at;

with response_seed (poll_id, player_id, status) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000003'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000004'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000005'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000006'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000007'::uuid, 'maybe'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000008'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000009'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000010'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000011'::uuid, 'maybe'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000012'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000013'::uuid, 'maybe'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000003'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000004'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000005'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000006'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000007'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000008'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000009'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000010'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000011'::uuid, 'maybe'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000012'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000013'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000003'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000004'::uuid, 'unavailable'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000005'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000006'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000007'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000008'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000009'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000010'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000011'::uuid, 'available'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000012'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000013'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000003'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000004'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000005'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000006'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000007'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000008'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000009'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000010'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000011'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000012'::uuid, 'unknown'),
    ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000013'::uuid, 'unknown')
)
insert into public.availability_responses (poll_id, player_id, status)
select poll_id, player_id, status
from response_seed
on conflict (poll_id, player_id) do update
set status = excluded.status;

insert into public.team_settings (
  id,
  team_name,
  team_slogan,
  team_password_hash,
  minimum_yes_players,
  mixed_minimum_women_on_field,
  libero_counts_as_full_woman,
  league_base_url,
  league_table_url,
  league_fixtures_url
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Lowhofer',
  'Let the Ox Fetz',
  'REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3',
  6,
  2,
  false,
  'https://www.volleyball-freizeit.de/saison/1083',
  'https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1',
  'https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1'
)
on conflict (id) do update
set team_name = excluded.team_name,
    team_slogan = excluded.team_slogan,
    team_password_hash = excluded.team_password_hash,
    minimum_yes_players = excluded.minimum_yes_players,
    mixed_minimum_women_on_field = excluded.mixed_minimum_women_on_field,
    libero_counts_as_full_woman = excluded.libero_counts_as_full_woman,
    league_base_url = excluded.league_base_url,
    league_table_url = excluded.league_table_url,
    league_fixtures_url = excluded.league_fixtures_url;
