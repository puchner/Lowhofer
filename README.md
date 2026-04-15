# Lowhofer Spieltagsplanung

MVP-Grundgeruest fuer eine responsive React-Webanwendung zur Spieltags- und Verfuegbarkeitsplanung der Mixed-Volleyballmannschaft Lowhofer.

## Start

```bash
npm install
npm run dev
```

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

Das Datenmodell fuer Paket 2 liegt unter `supabase/`.

- `supabase/migrations/202604150001_create_core_schema.sql` erstellt die Tabellen, Constraints, Indizes, Trigger und aktiviert RLS.
- `supabase/seeds/001_initial_lowhofer_data.sql` ueberfuehrt die bisherigen Mock-Spieler, Polls und Responses in initiale Daten.
- `src/data/supabaseMappers.ts` kapselt das Mapping zwischen DB-Slugs/`timestamptz` und dem bestehenden Frontendmodell.

Vor produktiver Nutzung muessen Admin-Spieler, Spielerliste und `team_settings.team_password_hash` fachlich bestaetigt bzw. ersetzt werden.

## Health Check

Nach einem lokalen Pages-Start oder Deployment kann der Functions-Einstieg hier geprueft werden:

```text
/api/health
```

Der Endpunkt zeigt nur, ob erforderliche Secrets konfiguriert sind. Secret-Werte werden nicht ausgegeben.

## Liga-Daten aktualisieren

Die bisherige lokale Importfunktion schreibt die Tabelle und Fixtures aus dem XML-Export der Liga in generierte JSON-Dateien.

```bash
npm run import:league
npm run build
```

In einem spaeteren Paket wird diese Logik in wiederverwendbare Parser ueberfuehrt und serverseitig ueber `/api/league/*` mit 15-Minuten-Cache angebunden.

## Struktur

```text
functions/             Cloudflare Pages Functions
  api/                 API-Endpunkte als /api/*
  _shared/             Serverseitige Hilfsfunktionen

supabase/
  migrations/          SQL-Migrationen fuer Supabase
  seeds/               Initiale Seed-Daten

src/
  api/                 Frontend-API-Konfiguration
  app/                 Routing
  components/layout/   App-Chrome
  components/ui/       Wiederverwendbare UI-Bausteine
  data/                Mock-Daten und Repository-Schicht
  domain/              Typen, Regeln und Analyse-Logik
  pages/               Routen-Seiten
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
