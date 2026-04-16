create unique index if not exists players_active_display_name_unique_idx
on public.players (lower(display_name))
where is_active = true;
