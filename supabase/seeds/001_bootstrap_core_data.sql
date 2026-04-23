-- Minimal bootstrap data for a fresh relaunch database.
-- Keep only records that cannot currently be created or maintained in the UI:
-- - initial player/login accounts
-- - admin flags and readonly training account
-- - team settings including password hash placeholder

begin;

insert into public.players (
  id,
  display_name,
  gender,
  is_active,
  is_admin,
  role,
  sort_order,
  avatar_kind,
  avatar_style,
  avatar_seed,
  avatar_storage_path
)
values
  ('00000000-0000-4000-8000-000000000001', 'Pia', 'female', true, true, 'member', 10, 'generated', 'thumbs', 'Aneka', null),
  ('00000000-0000-4000-8000-000000000002', 'Volker', 'male', true, true, 'member', 20, 'generated', 'thumbs', 'Felix', null),
  ('00000000-0000-4000-8000-000000000003', 'Lowhofer', 'diverse', true, false, 'training_member', 990, 'generated', 'bottts', 'Nova', null)
on conflict (id) do update
set display_name = excluded.display_name,
    gender = excluded.gender,
    is_active = excluded.is_active,
    is_admin = excluded.is_admin,
    role = excluded.role,
    sort_order = excluded.sort_order,
    avatar_kind = excluded.avatar_kind,
    avatar_style = excluded.avatar_style,
    avatar_seed = excluded.avatar_seed,
    avatar_storage_path = excluded.avatar_storage_path;

with player_positions_seed (player_id, position, is_primary) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'setter', true),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'outside', false),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'outside', true),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'opposite', false),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'outside', true)
)
insert into public.player_positions (player_id, position, is_primary)
select player_id, position, is_primary
from player_positions_seed
on conflict (player_id, position) do update
set is_primary = excluded.is_primary;

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
  'REPLACE_WITH_PBKDF2_HASH',
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

commit;
