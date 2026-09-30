alter table public.players
  add column if not exists temp_unavailable_reason text,
  add column if not exists temp_unavailable_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'players_temp_unavailable_reason_check'
      and conrelid = 'public.players'::regclass
  ) then
    alter table public.players
      add constraint players_temp_unavailable_reason_check
      check (
        temp_unavailable_reason is null
        or temp_unavailable_reason in ('illness_injury', 'travel', 'other')
      );
  end if;
end;
$$;
