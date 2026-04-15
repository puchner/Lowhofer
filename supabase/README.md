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

## Seeds

Die initialen Seed-Daten liegen in `supabase/seeds`.

Aktueller Stand:

- `001_initial_lowhofer_data.sql`
  - Spieler und Positionen aus den bisherigen Mock-Daten
  - bestehende Polls und Responses aus den Mock-Daten
  - initiale Team-Settings inklusive Liga-URLs

Vor produktiver Nutzung muessen fachlich bestaetigt werden:

- Spielerliste
- Admin-Spieler (`players.is_admin`)
- Team-Passwort-Hash (`team_settings.team_password_hash`)
- Liga-URLs in `team_settings`

## Ausfuehrung

Wenn kein Supabase-CLI-Workflow verbunden ist, koennen die SQL-Dateien im Supabase SQL Editor in dieser Reihenfolge ausgefuehrt werden:

1. `supabase/migrations/202604150001_create_core_schema.sql`
2. `supabase/seeds/001_initial_lowhofer_data.sql`

Die Cloudflare-Secrets fuer die spaetere API-Anbindung sind:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Der Service-Role-Key darf nur serverseitig in Cloudflare Pages Functions verwendet werden.
