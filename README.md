# Lowhofer Spieltagsplanung

Responsive Web-App zur Spieltags- und Verfuegbarkeitsplanung der Mixed-Volleyballmannschaft Lowhofer. Die App ersetzt Chat-/Tabellen-Abstimmungen durch einen kleinen, produktiv genutzten Team-Workflow fuer Termine, Rueckmeldungen, Spielerprofile und Liga-Daten.

## Was die App kann

- Team-Login mit gemeinsamem Passwort und Auswahl des aktiven Spielers
- Spieltage und Terminvorschlaege aus offiziellen Liga-Daten anlegen
- Rueckmeldungen pro Spieler speichern: Zusage, Absage, unsicher, Kommentar
- Admin-Workflow fuer Termine, Nachholtermine, Terminfinalisierung und Liga-Quelle
- Spielerprofile mit Positionen, Hauptposition, Geschlecht und Avatar pflegen
- Kaderanalyse mit Zusagen, Positionsabdeckung und Mixed-Regel-Hinweisen
- Liga-Tabelle und Spielplan serverseitig aus XML-Feeds laden und cachen
- Kalenderfeed fuer abonnierbare Spieltermine
- Gemeinsamer Nur-Lesen-Zugang fuer Mitleser ohne Spielerrechte

## Technik

- React 19, TypeScript, Vite, React Router
- Tailwind CSS, daisyUI und lucide-react fuer die UI
- Cloudflare Pages Functions als serverseitige API-Schicht
- Supabase/Postgres als Datenbank hinter Service-Role-gesicherten Functions
- Lokale Supabase-Testumgebung mit synthetischen Daten oder Produktionsdump
- Vitest fuer Domain- und API-nahe Fachlogiktests

## Start

```bash
npm install
npm run dev
```

## Lokale Testumgebung mit lokaler DB

Fuer eine produktionsnahe Testumgebung gibt es jetzt einen lokalen Supabase-Workflow mit Cloudflare Functions und Vite-Hot-Reload.

Voraussetzungen:

- Docker / Docker Compose
- `npm install`

Einmaliges lokales Aufsetzen:

```bash
npm run local:reset
```

Das macht folgendes:

- startet den lokalen Supabase-Stack
- erzeugt `.dev.vars` mit den lokalen Supabase-Zugangsdaten fuer Wrangler
- setzt die lokale DB neu auf
- spielt `supabase/schema/current.sql` ein
- importiert entweder `supabase/local/prod_clone.sql` oder generiert lokale Testdaten
- aktiviert lokal `LOCAL_TEST_DATA=true`, damit Tabellen- und Fixture-Ansichten die generierten Testdaten stabil verwenden

Normaler Entwicklungsstart mit Hot Reload:

```bash
npm run local:dev
```

Dann laufen:

- Vite-Frontend mit HMR auf `http://127.0.0.1:5173`
- Cloudflare Pages Functions lokal auf `http://127.0.0.1:8789`
- Supabase Studio auf `http://127.0.0.1:54323`

Das Vite-Dev-Setup proxyt `/api/*` automatisch an die lokale Functions-Instanz. Damit spricht die UI lokal gegen die lokale DB, nicht gegen Produktion.

Nuetzliche Kommandos:

- `npm run local:start` startet Supabase und erzeugt `.dev.vars`, ohne die DB zurueckzusetzen
- `npm run local:reset` setzt die lokale DB komplett neu auf
- `npm run local:db:stop` stoppt den lokalen Supabase-Stack
- `npm run local:testdata` erzeugt nur die synthetische SQL-Datei fuer lokale Testdaten neu
- `npm run local:functions` startet nur die lokale Functions-Instanz gegen die lokale DB, ohne Vite

### Standard: synthetische Testdaten

Ohne Produktionsdump erzeugt `npm run local:reset` automatisch eine lokale Testdatenbasis:

- 12 Spieler mit gemischten Positionen, Avataren und 2 Admins
- bestehende und offene Abstimmungen mit gemischten Rueckmeldungen
- offizielle Liga-Teams aus den XML-Exporten
- Ligaspiele in eine lokale "Saisonmitte" verschoben, damit noch mehrere offene Spiele zum Testen da sind

Das lokale Team-Passwort ist dabei:

```text
lowhofer-local
```

### Optional: Produktionsdaten lokal klonen

Lege alternativ einen SQL-Dump unter `supabase/local/prod_clone.sql` ab und fuehre danach erneut aus:

```bash
npm run local:reset
```

Empfohlen ist ein `data-only` Dump aus dem `public`-Schema. Die lokale Installation spielt zuerst `supabase/schema/current.sql` ein und importiert danach den Dump. Einen Repo-Seed braucht ihr dafuer nicht.

Beispiel mit Supabase-CLI gegen eine entfernte DB:

```bash
npx supabase db dump --data-only --schema public --db-url "postgresql://..." -f supabase/local/prod_clone.sql
```

Wenn sich das Schema aendert oder ihr neue Testdaten wollt, reicht erneut `npm run local:reset`. Im normalen Alltag ist kein erneutes Schema-Setzen und kein Reimport bei jedem Start noetig.

### Optional: lokalen Code gegen Produktiv-DB starten

Fuer gezielte Smoke-Tests kann die lokale App gegen die produktive Supabase-DB laufen. Das ist kein Standard-Entwicklungsworkflow: API-Aktionen schreiben dann in Produktion.

Lege lokal eine nicht versionierte Datei `.dev.vars.production` an:

```text
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=lokales-session-secret
CALENDAR_FEED_TOKEN=optional
LOCAL_TEST_DATA=false
```

Wichtig: `LOCAL_TEST_DATA=false` verhindert, dass Liga- und Fixture-Endpunkte lokale Testdaten liefern.

Dann starten:

```bash
npm run prod-db:dev
```

Das startet Wrangler mit den Werten aus `.dev.vars.production` auf `http://127.0.0.1:8789` und Vite mit HMR auf `http://127.0.0.1:5173`. Technisch laeuft Wrangler dafuer aus einem temporaeren Arbeitsverzeichnis, damit die normale lokale `.dev.vars` mit Testdaten nicht geladen wird.

## Cloudflare Pages

Das Projekt ist auf Cloudflare Pages mit Pages Functions vorbereitet.

- Frontend-Build: `dist`
- API-Laufzeit: `functions/api/*` als `/api/*`
- lokale Pages-Preview inklusive Functions:

```bash
npm run pages:dev
```

Produktiver Deploy per Wrangler:

```bash
npm run pages:deploy
```

In Cloudflare Pages sollten diese Build-Einstellungen verwendet werden:

- Build command: `npm run build`
- Output directory: `dist`

## Serverseitige Secrets

Diese Werte werden nur serverseitig in Cloudflare Pages Functions verwendet und duerfen nicht ins Frontend-Bundle:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`

Das Frontend spricht fuer MVP-Geschaeftsdaten mit `/api/*` und nutzt keinen direkten Supabase-Client.

## Supabase

Das aktuelle Datenmodell liegt unter `supabase/`.

- `supabase/schema/current.sql` ist das kanonische Relaunch-Schema fuer frische Datenbanken.
- `supabase/seeds/001_bootstrap_core_data.sql` ist ein optionaler Minimal-Seed fuer nicht-UI-pflegbare Stammdaten wie initiale Accounts, Rollen/Admins und Team-Settings.
- `supabase/archive/legacy-cutover/` enthaelt nur noch historische Cutover-SQL aus der Schema-Umstellung und ist nicht Teil des aktiven Setups.
- `src/data/supabaseMappers.ts` kapselt das Mapping zwischen DB-Slugs/`timestamptz` und dem bestehenden Frontendmodell.

Vor produktiver Nutzung muessen Spielerliste, Admins und `team_settings.team_password_hash` fachlich bestaetigt bzw. ersetzt werden.

## Session und Team-Passwort

Paket 3 schuetzt die App ueber ein gemeinsames Team-Passwort und speichert den aktiven Spieler in einem signierten httpOnly-Cookie.

- Session-Endpunkte liegen unter `functions/api/session/*`.
- `GET /api/players` liefert die aktive Spielerliste fuer die Spielerwahl.
- Passwort-Hashes werden mit PBKDF2/SHA-256 erzeugt. Cloudflare Pages Functions unterstuetzt in dieser Runtime maximal 100.000 PBKDF2-Iterationen; das Hash-Script erzeugt deshalb kompatible Hashes mit `100000`.
- Login und Spielerwahl laufen zusammen: `POST /api/session/login` akzeptiert `password` und `playerId`.
- Nach Login ist der aktive Spieler nicht frei wechselbar. `Ich bin nicht <Name>` beendet die Session.

Hash fuer das Team-Passwort erzeugen:

```bash
npm run hash:password -- "DEIN_TEAM_PASSWORT"
```

Den ausgegebenen Hash in `team_settings.team_password_hash` eintragen oder vor dem optionalen Bootstrap-Seed in `supabase/seeds/001_bootstrap_core_data.sql` ersetzen.

## API-Datenfluss

Spieler, Polls und Responses laufen ueber Cloudflare Pages Functions gegen Supabase.

- `GET /api/players`
- `GET /api/polls`
- `GET /api/polls/:pollId`
- `POST /api/polls` fuer Admins
- `PATCH /api/polls/:pollId` fuer Admins
- `DELETE /api/polls/:pollId` fuer Admins
- `PUT /api/polls/:pollId/response`

Response-Writes verwenden den aktiven Spieler aus der signierten Session. Das Frontend sendet keine fremde `playerId` fuer Abstimmungen.

## Health Check

Nach einem lokalen Pages-Start oder Deployment kann der Functions-Einstieg hier geprueft werden:

```text
/api/health
```

Der Endpunkt zeigt nur, ob erforderliche Secrets konfiguriert sind. Secret-Werte werden nicht ausgegeben.

## Liga-Daten

Liga-Tabelle und Fixtures werden serverseitig ueber `/api/league/*` geladen und 15 Minuten in Supabase gecacht.

- `GET /api/league/table` – Tabelle (gecacht, Fallback auf letzten gueltigen Stand)
- `GET /api/league/fixtures` – Lowhofer-Fixture-Liste (gecacht, nur zukuenftige Spiele)
- `GET /api/team-settings/league-source` – aktuelle Liga-Basis-URL (nur authentifiziert)
- `PATCH /api/team-settings/league-source` – Liga-Quelle aendern (nur Admin)

### Liga-Quelle aendern

Ein Admin kann auf der Tabellen-Seite ganz unten die Basis-URL der Liga-Seite eingeben:

```text
https://www.volleyball-freizeit.de/saison/1083
```

Die konkreten XML-Abruf-URLs fuer Tabelle und Spielplan werden automatisch abgeleitet. Der Cache wird bei jeder Aenderung automatisch geleert.

## Struktur

```text
functions/             Cloudflare Pages Functions
  api/                 API-Endpunkte als /api/*
    league/            Liga-Tabelle und Fixtures (gecacht)
    team-settings/     Team-Konfiguration (Admin)
  _shared/             Serverseitige Hilfsfunktionen
    leagueParser.ts    XML-Parser fuer Tabelle und Spielplan
    leagueSource.ts    URL-Ableitung aus Liga-Basis-URL

supabase/
  schema/              Aktuelles kanonisches DB-Schema
  seeds/               Optionaler Bootstrap-Seed fuer Stammdaten
  archive/             Historische Cutover-SQL

src/
  api/                 Frontend-API-Konfiguration
  app/                 Routing
  components/layout/   App-Chrome
  components/ui/       Wiederverwendbare UI-Bausteine
  data/                Mock-Daten und Repository-Schicht
  domain/              Typen, Regeln und Analyse-Logik
  pages/               Routen-Seiten
  session/             Session-Context, Passwort-Gate und Spielerwahl
  state/               React Context fuer MVP-State
  styles/              Tailwind-Einstieg
```

## Firebase-Altlasten

Firebase ist nicht mehr Zielplattform dieses Projekts.

- `firebase-tools` wurde entfernt
- Firebase-Deploy-Skripte wurden entfernt
- `firebase.json` und `.firebaserc` wurden entfernt

Die Zielarchitektur ist Cloudflare Pages + Pages Functions + Supabase hinter der API.

## Annahmen

- Feldbesetzung prueft im MVP eine Kernaufstellung aus Zuspiel, zwei Aussen, zwei Mitte und Diagonal.
- Libero wird in der Mixed-Regel standardmaessig nicht als Feld-Dame gezaehlt.
- Der Ligatermin `Loud'n'Proud` ist in der Quelle unbestimmt und deshalb als Platzhaltertermin markiert.
- Persistenz, Session und Verbandsdaten werden schrittweise von Mock-/LocalStorage-Daten auf API + Supabase migriert.
