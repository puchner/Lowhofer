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

## Lokale Datenbank

Fuer lokale Entwicklung ist jetzt ein Supabase-CLI-Workflow im Repo vorgesehen.

Wichtige Kommandos aus dem Projekt-Root:

```bash
npm run local:setup
npm run local:dev
```

`npm run local:setup` startet den lokalen Stack und setzt die Datenbank neu auf:

- `supabase/relaunch_schema.sql`
- standardmaessig synthetische lokale Testdaten aus `scripts/generateLocalTestData.mjs`
- optional `supabase/local/prod_clone.sql`, falls ein Produktionsklon vorhanden ist
- fuer lokale Functions wird `LOCAL_TEST_DATA=true` gesetzt, damit Liga-Tabelle und Fixtures aus dem lokalen Cache kommen

`npm run local:dev` startet die Oberflaeche mit Vite-HMR und laesst `/api/*` gegen die lokale Cloudflare-Functions-Instanz laufen.

### Synthetische Testdaten

Ohne Produktionsdump werden automatisch lokale Beispieldaten erzeugt:

- 12 Spieler mit gemischten Positionen und Avataren
- 2 Admins
- offene und archivierte Polls
- reale Liga-Teams und Lowhofer-Gegner aus den offiziellen XML-Abrufen
- Ligatermine relativ zu heute verschoben, damit lokal eine "Saisonmitte" entsteht

Lokales Team-Passwort:

```text
lowhofer-local
```

### Clone-Dump-Format

Fuer produktionsnahe lokale Tests sollte der Export als `data-only` SQL-Dump fuer `public` erfolgen, abgelegt unter:

```text
supabase/local/prod_clone.sql
```

Danach erneut:

```bash
npm run local:reset
```

Repo-Seeds sind fuer diesen Workflow nicht noetig.

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
