-- Paket 5: league_base_url in team_settings ergänzen
-- Speichert die vom Admin eingegebene Saison-Basis-URL (z. B. https://www.volleyball-freizeit.de/saison/1083).
-- Die konkreten XML-Abruf-URLs bleiben in league_table_url und league_fixtures_url.

alter table public.team_settings
  add column if not exists league_base_url text;
