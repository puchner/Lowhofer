# Supabase Setup

Die Datenbank ist fuer den MVP als reine Server-Datenbank hinter den Cloudflare Pages Functions gedacht. Das Frontend soll keine Geschaeftsdaten direkt aus Supabase laden.

## Migrationen

Die Migrationen liegen in `supabase/migrations`.

Aktueller Stand:

- `202604150001_create_core_schema.sql`
  - Tabellen fuer Spieler, Positionen, Polls, Responses, Team-Settings und Liga-Cache
  - CHECK-Constraints fuer fachliche Slugs
  - `updated_at`-Trigger
  - Indizes fuer die geplanten API-Zugriffe
  - RLS aktiviert, ohne Browser-Policies
- `202604160002_add_player_avatars.sql`
  - Avatar-Metadaten fuer generierte Spieler-Avatare
- `202604160003_create_player_update_state.sql`
  - Gesehen-Status fuer App-Updates pro Spieler
- `202604160004_add_training_member_role.sql`
  - Rollenfeld fuer Login-Accounts
  - gemeinsamer Nur-Lesen-Zugang `Lowhofer` mit Rolle `training_member`

## Seeds

Die initialen Seed-Daten liegen in `supabase/seeds`.

Aktueller Stand:

- `001_initial_lowhofer_data.sql`
  - Spieler und Positionen aus den bisherigen Mock-Daten
  - bestehende Polls und Responses aus den Mock-Daten
  - initiale Team-Settings inklusive Liga-URLs
  - Pia und Volker als initiale Admin-Spieler

Vor produktiver Nutzung muessen fachlich bestaetigt werden:

- Spielerliste
- Team-Passwort-Hash (`team_settings.team_password_hash`)
- Liga-URLs in `team_settings`

## Ausfuehrung

Wenn kein Supabase-CLI-Workflow verbunden ist, koennen die SQL-Dateien im Supabase SQL Editor in dieser Reihenfolge ausgefuehrt werden:

1. `supabase/migrations/202604150001_create_core_schema.sql`
2. `supabase/migrations/202604160002_add_player_avatars.sql`
3. `supabase/migrations/202604160003_create_player_update_state.sql`
4. `supabase/seeds/001_initial_lowhofer_data.sql`
5. `supabase/migrations/202604160004_add_training_member_role.sql`

Die Cloudflare-Secrets fuer die spaetere API-Anbindung sind:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Der Service-Role-Key darf nur serverseitig in Cloudflare Pages Functions verwendet werden.

## Passwort-Hash

Der Passwort-Hash kann nach Paket 3 lokal erzeugt werden:

```bash
npm run hash:password -- "DEIN_TEAM_PASSWORT"
```

Das Script verwendet bewusst `100000` PBKDF2-Iterationen, weil Cloudflare Pages Functions in der verwendeten Runtime hoehere Werte ablehnt.

Dann entweder vor dem Seed den Platzhalter `REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3` ersetzen oder nach dem Seed per SQL aktualisieren:

```sql
update public.team_settings
set team_password_hash = 'DEIN_GENERIERTER_HASH';
```
