# Paket 5 – Verbandsdaten und 15-Minuten-Cache

## Ziel
Liga-Tabelle und Fixtures serverseitig laden, parsen, normalisieren und mit 15-Minuten-TTL cachen.

## Voraussetzung
Paket 1 ist im Repo umgesetzt. League-Endpunkte sollen als Cloudflare Pages Functions unter `functions/api/league/*` entstehen.
Paket 2 hat die Tabelle `league_cache` sowie die Liga-URL-Felder in `team_settings` angelegt.

## Verbindliche Regel
Verbandsdaten werden **nicht direkt im Browser** geladen.

## Quellen
Aktuell:
- Tabelle: `https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1`
- Fixtures: `https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1`

Diese URLs sollen in `team_settings` oder Konfiguration gekapselt werden.
Im vorbereiteten Seed stehen sie in `team_settings.league_table_url` und `team_settings.league_fixtures_url`.

## API-Endpunkte

### `GET /api/league/table`
Antwort:
- normalisierte Tabelle
- `fetchedAt`
- `expiresAt`
- optional `isStale`

### `GET /api/league/fixtures`
Antwort:
- normalisierte Lowhofer-Fixtures
- `fetchedAt`
- `expiresAt`
- optional `isStale`

### Optional: `POST /api/league/refresh`
- admin-only
- nicht zwingend für MVP

## Cache-Logik
Für `table` und `fixtures` jeweils:

1. Cache-Datensatz in `league_cache` laden
2. wenn `expires_at > now()`:
   - Cache zurückgeben
3. sonst:
   - Verband abrufen
   - XML parsen
   - internes JSON erzeugen
   - Cache aktualisieren
4. falls Abruf oder Parsing fehlschlägt:
   - letzten gültigen Cache zurückgeben
   - als stale kennzeichnen

## Wiederverwendung bestehender Logik
Der bestehende Importer und die Tabellenlogik sollen in wiederverwendbare Bausteine zerlegt werden:

- reines Parsing / Mapping in `shared/league/*`
- CLI-Script für lokale Tests weiterhin nutzbar
- API nutzt dieselben Parser

## Frontend-Anbindung
- `/table` nutzt `GET /api/league/table`
- Admin-Poll-Anlage nutzt `GET /api/league/fixtures`
- UI zeigt Datenstand an, z. B.:
  - zuletzt aktualisiert
  - optional Hinweis bei stale fallback

## Fehlerstrategie
Wenn der Verband nicht erreichbar ist:
- letzten gültigen Cache weiter anzeigen
- Nutzer sauber informieren
- nicht einfach komplett leer rendern

## Deliverables
- serverseitige League-API
- 15-Minuten-Cache
- Fallback auf letzten gültigen Stand
- produktive Anbindung an Tabelle und Fixture-Auswahl

## Hinweise für den Agent
- keinen unnötigen Paid-Cloudflare-Speicher einplanen
- Cache für MVP in Supabase `league_cache` speichern
- Cloudflare KV / D1 nicht voraussetzen

## Free-Plan-Einschätzung
Für euren Umfang weiterhin klar im Free-Tier-Rahmen:
- seltene XML-Abrufe
- sehr wenige Nutzer
- 15-Minuten-TTL reduziert Requests zusätzlich
