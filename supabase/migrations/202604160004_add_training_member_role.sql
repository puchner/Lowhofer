alter table public.players
add column if not exists role text not null default 'member';

alter table public.players
drop constraint if exists players_role_check;

alter table public.players
add constraint players_role_check check (role in ('member', 'training_member'));

create index if not exists players_role_active_idx on public.players (role, is_active);

insert into public.players (id, display_name, gender, is_active, is_admin, role, sort_order)
values (
  '00000000-0000-4000-8000-000000000099',
  'Lowhofer',
  'diverse',
  true,
  false,
  'training_member',
  990
)
on conflict (id) do update
set display_name = excluded.display_name,
    gender = excluded.gender,
    is_active = excluded.is_active,
    is_admin = excluded.is_admin,
    role = excluded.role,
    sort_order = excluded.sort_order;
