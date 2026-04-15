# Paket 2 – Datenmodell und Supabase

## Status
Im Repo umgesetzt.

Erstellt wurden:
- `supabase/migrations/202604150001_create_core_schema.sql`
- `supabase/seeds/001_initial_lowhofer_data.sql`
- `supabase/README.md`
- `src/data/supabaseMappers.ts`

Noch außerhalb der IDE offen:
- Migration und Seed im Supabase-Projekt ausführen oder Workflow verbinden
- Spielerliste fachlich bestätigen (erledigt: Liste passt)
- Admin-Spieler festlegen (erledigt: Pia und Volker)
- Team-Passwort-Hash erzeugen und den Seed-Platzhalter ersetzen
- Liga-URLs in `team_settings` prüfen

## Ziel
Die bisherige LocalStorage-/Mock-Persistenz durch ein relationales Datenmodell in Supabase ersetzen.

## Voraussetzung
Paket 1 ist im Repo umgesetzt. Die API-Zielstruktur liegt unter `functions/api/*`, serverseitige Hilfsfunktionen unter `functions/_shared/*`.

## Architekturgrundsatz
Supabase ist für den MVP **nur die Datenbank hinter der API**.  
Das Frontend soll nicht parallel direkt mit Supabase für Geschäftsdaten sprechen.

## Wichtige Modellentscheidungen
- `homeAway` ist ein eigenes, verpflichtendes fachliches Feld
- `homeAway` verwendet im MVP die Werte `home`, `away`, `unknown`
- `starts_at` wird als `timestamptz` gespeichert
- Fachliche Standardzeitzone: `Europe/Berlin`
- Historischer Alias `MatchDay` darf im Frontend vorerst existieren, aber neue DB-/API-Strukturen nutzen `AvailabilityPoll`

## Zieltabellen

### `players`
- `id uuid primary key default gen_random_uuid()`
- `display_name text not null`
- `gender text not null`
- `is_active boolean not null default true`
- `is_admin boolean not null default false`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `player_positions`
- `id uuid primary key default gen_random_uuid()`
- `player_id uuid not null references players(id) on delete cascade`
- `position text not null`
- `is_primary boolean not null default false`

### `availability_polls`
- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `poll_type text not null`
- `poll_status text not null`
- `starts_at timestamptz`
- `location text`
- `home_away text not null`
- `opponent_name text`
- `notes text`
- `source_type text not null default 'custom'`
- `league_fixture_external_id text`
- `created_by_player_id uuid references players(id)`
- `archived_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `availability_responses`
- `id uuid primary key default gen_random_uuid()`
- `poll_id uuid not null references availability_polls(id) on delete cascade`
- `player_id uuid not null references players(id) on delete cascade`
- `status text not null`
- `comment text`
- `updated_at timestamptz not null default now()`
- unique `(poll_id, player_id)`

### `team_settings`
- `id uuid primary key default gen_random_uuid()`
- `team_name text not null`
- `team_slogan text`
- `team_password_hash text not null`
- `minimum_yes_players integer not null default 6`
- `mixed_minimum_women_on_field integer not null default 2`
- `libero_counts_as_full_woman boolean not null default false`
- `league_table_url text`
- `league_fixtures_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `league_cache`
- `id uuid primary key default gen_random_uuid()`
- `cache_key text not null unique`
- `payload_json jsonb not null`
- `fetched_at timestamptz not null`
- `expires_at timestamptz not null`
- `source_url text not null`
- `etag text`
- `last_modified text`

## CHECK-Constraints
Folgende Constraints bewusst ergänzen:
- `players.gender`
- `player_positions.position`
- `availability_polls.poll_type`
- `availability_polls.poll_status`
- `availability_polls.home_away`
- `availability_responses.status`

Beispielwerte:
- `gender`: `male`, `female`, `diverse`
- `home_away`: `home`, `away`, `unknown`
- `poll_type`: `match`, `date-finding`
- `poll_status`: `open`, `archived`, `cancelled`
- `availability_responses.status`: technische Slugs `available`, `unavailable`, `maybe`, `unknown`

## Statuswerte und Labels
Die Datenbank soll technische Slugs speichern, nicht die deutschen UI-Labels.

Mapping-Beispiel:
- `available` -> `zugesagt`
- `unavailable` -> `abgesagt`
- `maybe` -> `unsicher`
- `unknown` -> `keine Rückmeldung`

Die deutschen Labels bleiben reine Frontend-/Domain-Darstellung.

## Indizes und technische DB-Details
Die Migrationen sollen zusätzlich enthalten:

- `pgcrypto` aktivieren, falls für `gen_random_uuid()` nötig
- Defaults `default gen_random_uuid()` für UUID-Primärschlüssel
- `updated_at`-Pflege über Trigger oder bewusst zentralisierte API-Updates
- Index auf `player_positions(player_id)`
- Index auf `availability_polls(poll_status, starts_at)`
- Index auf `availability_responses(poll_id)`
- Index auf `availability_responses(player_id)`
- Unique Constraint auf `availability_responses(poll_id, player_id)`
- Singleton-Regel für `team_settings`, z. B. eine feste ID oder ein Constraint, der genau eine aktive Team-Konfiguration erzwingt

## Zeitmodell
Der Agent soll ein sauberes Mapping zwischen aktuellem Frontendmodell und DB-Modell einführen.

### Anforderungen
- DB speichert `starts_at` als `timestamptz`
- fachliche Interpretation in `Europe/Berlin`
- keine verstreuten Datums-/Zeitzonen-Hacks
- zentrale Mapper einführen

## Seed-Strategie
Die bestehenden Mock-Daten sollen nicht verworfen, sondern in Seeds überführt werden:
- Spieler
- Positionen
- bestehende Polls
- vorhandene Responses, sofern sinnvoll
- Team-Settings mit initialem Teamnamen/Slogan

## Aufgaben des Nutzers außerhalb der IDE

Der Agent kann Migrationen und Seeds vorbereiten, braucht aber fachliche bzw. Dashboard-Schritte vom Nutzer:

- Supabase-Projekt anlegen
- `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` aus dem Supabase-Dashboard entnehmen
- diese Werte spaeter als Cloudflare-Secrets setzen
- SQL-Migrationen im Supabase-Projekt ausführen oder Migrationsworkflow verbinden
- initiale Spielerliste fachlich bestätigen
- festlegen, welcher Spieler `is_admin = true` bekommt
- Team-Passwort festlegen und den Seed für `team_password_hash` freigeben
- prüfen, ob die initialen Liga-URLs in `team_settings` korrekt sind

## Deliverables
- [x] SQL-Migrationen
- [x] sinnvolle Indizes und Constraints
- [x] Seed-Daten auf Basis der Mock-Daten
- [x] Mapper zwischen DB und Frontendmodell

## Hinweise für den Agent
- Noch keine unnötige Voll-Umbenennung von `MatchDay`
- `homeAway` niemals aus dem Ort ableiten
- `location` und `home_away` sind zwei getrennte fachliche Informationen

## Free-Plan-Einschätzung
Dieses Paket bleibt für euren Umfang weiterhin im Supabase-Free-Plan-Bereich:
- sehr kleine DB
- sehr wenig Nutzer
- sehr geringe Last
