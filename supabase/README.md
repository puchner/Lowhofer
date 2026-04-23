# Supabase Setup

Die Datenbank ist fuer den MVP als reine Server-Datenbank hinter den Cloudflare Pages Functions gedacht. Das Frontend laedt keine Geschaeftsdaten direkt aus Supabase.

## Aktiver Stand

Das aktuelle Relaunch-Schema liegt als Vollsnapshot in `supabase/schema/current.sql`.

Der reguläre Neuaufsetz-Workflow ist:

1. `supabase/schema/current.sql`
2. optional `supabase/seeds/001_bootstrap_core_data.sql`
3. entweder `supabase/local/prod_clone.sql` oder `supabase/local/generated_test_data.sql`

Der optionale Bootstrap-Seed enthaelt bewusst nur Daten, die heute nicht ueber die UI gepflegt werden:

- initiale Spieler-/Login-Accounts
- Admin-Flags
- gemeinsamer Nur-Lesen-Zugang `Lowhofer`
- Team-Settings inklusive Passwort-Hash-Platzhalter und Liga-URLs

Polls, Responses, Matches und Appointments gehoeren nicht mehr in einen Repo-Seed.

## Archiv

Die frueheren schrittweisen Migrationen und Cutover-Skripte liegen nur noch als Referenz unter:

```text
supabase/archive/legacy-cutover/
```

Diese Dateien waren fuer die einmalige Ueberfuehrung vom alten Schema gedacht und gehoeren nicht mehr zum aktiven Setup einer frischen Datenbank.

## Ausfuehrung

Wenn kein Supabase-CLI-Workflow verbunden ist, koennen die SQL-Dateien im Supabase SQL Editor in dieser Reihenfolge ausgefuehrt werden:

1. `supabase/schema/current.sql`
2. optional `supabase/seeds/001_bootstrap_core_data.sql`

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

- `supabase/schema/current.sql`
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

Der Repo-Seed ist fuer diesen Workflow nicht noetig, weil lokale Testdaten oder ein Produktionsklon eingespielt werden.

## Passwort-Hash

Der Passwort-Hash kann nach Paket 3 lokal erzeugt werden:

```bash
npm run hash:password -- "DEIN_TEAM_PASSWORT"
```

Das Script verwendet bewusst `100000` PBKDF2-Iterationen, weil Cloudflare Pages Functions in der verwendeten Runtime hoehere Werte ablehnt.

Dann entweder vor dem optionalen Bootstrap-Seed den Platzhalter `REPLACE_WITH_PBKDF2_HASH` ersetzen oder nachtraeglich per SQL aktualisieren:

```sql
update public.team_settings
set team_password_hash = 'DEIN_GENERIERTER_HASH';
```
