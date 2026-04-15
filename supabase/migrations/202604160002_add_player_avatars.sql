alter table public.players
add column if not exists avatar_kind text not null default 'generated',
add column if not exists avatar_style text,
add column if not exists avatar_seed text,
add column if not exists avatar_storage_path text;

alter table public.players
drop constraint if exists players_avatar_kind_check;

alter table public.players
add constraint players_avatar_kind_check check (avatar_kind in ('generated', 'uploaded'));
