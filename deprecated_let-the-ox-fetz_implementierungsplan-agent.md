# Implementierungsplan für den IDE-Agent – Let the Ox Fetz

## Ziel dieses Dokuments

Dieses Dokument ist als **Arbeitsanweisung für einen AI-Coding-Agent in der IDE** formuliert.  
Es beschreibt die Zielarchitektur, die Prioritäten, die Umsetzungsreihenfolge, die fachlichen Entscheidungen und die Grenzen des Systems.

Der Agent soll **nicht** eigenmächtig die Produktanforderungen ändern, sondern die bestehende App kontrolliert von einem lokalen Mock-MVP zu einer produktiv nutzbaren Team-App weiterentwickeln.

---

# 1. Produktkontext

## 1.1 Zweck der App
Die App „Let the Ox Fetz“ dient der Verfügbarkeitsplanung einer Mixed-Volleyballmannschaft („Lowhofer“).

Sie ersetzt WhatsApp-Abstimmungen für:
- Spieltage
- ggf. sonstige Terminabstimmungen

Zusätzlich analysiert sie:
- Spielfähigkeit
- Rollen-/Positionsabdeckung
- Mixed-Regel
- Tabellenkontext
- Ergebnisprojektionen für Ligaspiele

## 1.2 Bestehender Stand
Die App existiert bereits als React/Vite-Anwendung mit:
- React 19
- TypeScript
- Tailwind CSS + daisyUI
- React Router
- React Context + LocalStorage
- Mock-Daten
- Liga-Importscript
- Admin-UI ohne echte Absicherung

Die bestehende fachliche Logik ist grundsätzlich wertvoll und soll soweit sinnvoll erhalten bleiben.

---

# 2. Verbindliche Architekturentscheidungen

Diese Entscheidungen gelten als fest und sollen **nicht** neu diskutiert oder ersetzt werden.

## 2.1 Hosting / Systemarchitektur
Zielarchitektur:

- **Frontend:** Cloudflare Pages
- **Serverlogik / API:** Cloudflare Pages Functions oder Workers
- **Datenbank:** Supabase (Postgres)
- **Kein Firebase Auth**
- **Kein Firestore**
- **Keine personenbezogene Auth per E-Mail, Magic Link oder Google**

## 2.2 Authentifizierungsmodell
Die App verwendet **kein klassisches Benutzerkonto pro Person**.

Stattdessen gilt:

### Zugangsstufe 1
Ein **gemeinsames Team-Passwort** schützt die gesamte App.

### Zugangsstufe 2
Nach erfolgreichem Team-Zugang wählt der Nutzer **seinen Namen aus einer Spielerliste**.

### Wichtige Implikationen
- Das ist ein **vertrauensbasiertes Team-Modell**
- Es ist **kein hart personenbezogen abgesichertes Login**
- Es muss aber verhindert werden, dass Außenstehende ohne Passwort Zugriff haben

## 2.3 Rechte
Es gibt mindestens zwei Rollen:

- `player`
- `admin`

### Spieler dürfen:
- App sehen
- Tabelle sehen
- Polls sehen
- ihre eigene Verfügbarkeit setzen

### Admin darf:
- Polls/Termine anlegen
- Polls/Termine bearbeiten
- Polls/Termine archivieren/löschen
- Liga-Fixtures als Polls übernehmen
- Spielerverwaltung nutzen

### Admin darf **nicht**:
- für andere Spieler Zu-/Absagen setzen

## 2.4 Verbandsdaten
Verbandsdaten werden **nicht im Browser direkt** geladen.

Sie werden über serverseitige API-Endpunkte geholt und gecacht.

### Cache-Regel
- Cache-Dauer: **15 Minuten**
- Wenn Cache jünger als 15 Minuten ist: Cache zurückgeben
- Wenn Cache älter ist: neu vom Verband laden, parsen, normalisieren und Cache aktualisieren
- Falls Aktualisierung fehlschlägt: letzten gültigen Cache zurückgeben

## 2.5 Quellen der Verbandsdaten
Der Verband stellt XML-Endpunkte bereit. Aktuell verwendet:

- Tabelle:
  - `https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1`
- Spielplan / Fixtures:
  - `https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1`

Diese URLs sollen konfigurierbar gekapselt werden.

## 2.6 Migration der Persistenz
Die bisherige LocalStorage-Lösung ist nur Übergangscode.

Ziel:
- Persistente Team-Daten in Supabase
- LocalStorage nur noch für UI-nahe Dinge, z. B.:
  - aktiver Spieler
  - evtl. zuletzt gewählte UI-Ansicht

---

# 3. Arbeitsprinzipien für den Agent

## 3.1 Kein Big-Bang-Rewrite
Die App soll inkrementell umgebaut werden.

Der Agent soll:
- funktionierende Domain-Logik erhalten
- bestehende UI nur dort ändern, wo es für die neue Architektur nötig ist
- Persistenz, Session und Verbandsintegration schrittweise ersetzen

## 3.2 Fachlogik von Infrastruktur trennen
Bestehende Domain-Dateien wie:
- `analyzeSquad.ts`
- `lineup.ts`
- `squadRules.ts`
- `leagueTable.ts`

sollen fachlich weitgehend unabhängig bleiben.

Der Agent soll keine API-/Storage-Logik in diese Dateien mischen.

## 3.3 API als neue Quelle der Wahrheit
Nach der Umstellung gilt:
- Frontend konsumiert API
- API greift auf DB / Cache / Verbandsquellen zu
- LocalStorage ist nicht mehr Quelle der eigentlichen Geschäftsdaten

## 3.4 Vorsicht bei Refactorings
Der historische Name `MatchDay` ist bekannt, aber noch im Code präsent.

### Vorgehen:
- neue DB-/API-Strukturen konsequent auf `AvailabilityPoll` auslegen
- `MatchDay` zunächst tolerieren, wo es Migrationsaufwand reduziert
- komplettes Umbenennen erst nach stabiler Backend-Einführung

## 3.5 Keine unnötigen Bibliotheken
Der Agent soll keine zusätzlichen großen Libraries einführen, wenn das Problem mit Bordmitteln oder kleinen Hilfsbibliotheken sauber lösbar ist.

---

# 4. Zielzustand

Wenn der Implementierungsplan abgeschlossen ist, soll die App Folgendes können:

## 4.1 Zugang und Nutzung
- Team-Link öffnen
- Team-Passwort eingeben
- eigenen Spielernamen auswählen
- Polls sehen und die eigene Verfügbarkeit setzen
- Tabellenansicht öffnen
- aktuelle Liga-Tabelle sehen

## 4.2 Admin-Funktionen
- Poll anlegen
- Liga-Fixture als Poll übernehmen
- Custom-Poll anlegen
- Poll bearbeiten
- Poll archivieren oder löschen
- Spieler verwalten

## 4.3 Datenhaltung
- alle relevanten Polls, Spieler und Responses sind teamweit persistent
- kein LocalStorage-Merge mehr als primäre Datenhaltung
- nur UI-relevante lokale Speicherung bleibt

## 4.4 Verbandsdaten
- Tabelle wird über API geladen
- Fixtures werden über API geladen
- beide Datenquellen sind 15 Minuten gecacht
- bei Fehlern wird letzter Cache zurückgegeben

---

# 5. Empfohlene Projektstruktur

Der Agent soll die bestehende Struktur behutsam in diese Richtung entwickeln.

```text
project-root/
  src/
    app/
    components/
    pages/
    routes/
    context/
    hooks/
    api/
    domain/
    types/
    utils/

  functions/            # Cloudflare Pages Functions oder Worker-nahe API-Endpunkte
    api/
      session/
      players/
      polls/
      league/

  shared/
    league/
    validation/
    dto/
    constants/

  db/
    migrations/
    seeds/

  scripts/
    importLeagueData.mjs
    seedData.mjs
```

Hinweis:
- tatsächliche Struktur darf an das bestehende Repo angepasst werden
- wichtig ist die **saubere Trennung** zwischen Frontend, Serverlogik, Shared-Mapping und DB-Migrationen

---

# 6. Ziel-Datenmodell in Supabase

Der Agent soll SQL-Migrationen für ein relationales Modell vorbereiten.

## 6.1 players
Tabelle für Spielerprofile.

Vorgeschlagene Felder:
- `id uuid primary key`
- `display_name text not null`
- `gender text not null`
- `is_active boolean not null default true`
- `is_admin boolean not null default false`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 6.2 player_positions
Mehrfachpositionen pro Spieler.

Felder:
- `id uuid primary key`
- `player_id uuid not null references players(id) on delete cascade`
- `position text not null`
- `is_primary boolean not null default false`

## 6.3 availability_polls
Zentrale Poll-Tabelle.

Felder:
- `id uuid primary key`
- `title text not null`
- `poll_type text not null`
- `poll_status text not null`
- `starts_at timestamptz`
- `location text`
- `opponent_name text`
- `notes text`
- `source_type text not null default 'custom'`
- `league_fixture_external_id text`
- `created_by_player_id uuid references players(id)`
- `archived_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 6.4 availability_responses
Antworten pro Poll und Spieler.

Felder:
- `id uuid primary key`
- `poll_id uuid not null references availability_polls(id) on delete cascade`
- `player_id uuid not null references players(id) on delete cascade`
- `status text not null`
- `comment text`
- `updated_at timestamptz not null default now()`

Constraint:
- unique `(poll_id, player_id)`

## 6.5 team_settings
Teamweite Einstellungen.

Felder:
- `id uuid primary key`
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

## 6.6 league_cache
Cache für Verbandstabelle und Fixtures.

Felder:
- `id uuid primary key`
- `cache_key text not null unique`
- `payload_json jsonb not null`
- `fetched_at timestamptz not null`
- `expires_at timestamptz not null`
- `source_url text not null`
- `etag text`
- `last_modified text`

---

# 7. API-Zielbild

Der Agent soll eine schlanke API-Schicht implementieren.

## 7.1 Session-Endpunkte

### `GET /api/session`
Antwort:
- ob Team-Session gültig ist
- optional Metadaten wie Ablaufzeit

### `POST /api/session/login`
Input:
- `password`

Verhalten:
- Team-Passwort gegen gehashten Wert in `team_settings` prüfen
- bei Erfolg sichere Session setzen
- Session über httpOnly Cookie halten

### `POST /api/session/logout`
Verhalten:
- Session beenden
- Cookie löschen

## 7.2 Spieler-Endpunkte

### `GET /api/players`
Liefert aktive Spieler für Auswahl und Spielerverwaltung.

### `POST /api/players`
Admin-only.

### `PATCH /api/players/:id`
Admin-only.

## 7.3 Poll-Endpunkte

### `GET /api/polls`
Optional filterbar nach Status.

### `GET /api/polls/:id`
Detailansicht.

### `POST /api/polls`
Admin-only.

### `PATCH /api/polls/:id`
Admin-only.

### `DELETE /api/polls/:id`
Admin-only.  
Bevorzugt soft delete oder Statusänderung statt hartem Löschen, falls praktikabel.

## 7.4 Response-Endpunkte

### `PUT /api/polls/:pollId/responses/:playerId`
Regeln:
- nur mit gültiger Team-Session
- nur für den **aktuell ausgewählten** Spieler erlaubt
- kein Schreiben für andere Spieler
- Admin hat hier **keine Sonderrechte**

## 7.5 League-Endpunkte

### `GET /api/league/table`
- prüft Cache
- lädt bei Bedarf XML vom Verband
- mapped in internes JSON
- liefert `fetchedAt`, `expiresAt`, `data`

### `GET /api/league/fixtures`
- gleiches Muster wie Tabelle

### `POST /api/league/refresh`
Optional, admin-only.  
Nicht zwingend zuerst notwendig.

---

# 8. Session- und Sicherheitsmodell

## 8.1 Team-Sitzung
Die App benötigt eine serverseitig bestätigte Team-Sitzung.

### Anforderungen
- Passwortprüfung nur serverseitig
- Cookie als `httpOnly`
- nur über HTTPS produktiv
- Session darf nicht im Frontend „selbst gebaut“ werden

## 8.2 Spielerauswahl
Nach erfolgreicher Session wählt der Nutzer seinen Namen.

### Speicherung
- aktiver Spieler im Frontend, z. B. LocalStorage
- nur als UX-Hilfe
- nicht als alleinige Sicherheitsquelle

### Wichtige Produktrealität
Dieses Modell ist **vertrauensbasiert**.  
Es soll sauber implementiert, aber nicht künstlich als hochsicheres personenbezogenes System ausgegeben werden.

## 8.3 Admin-Schutz
Admin-Rechte dürfen **nicht nur in der UI** versteckt werden.

Der Agent soll:
- Admin-Endpunkte serverseitig schützen
- Admin-Routen frontseitig sinnvoll guard-en

---

# 9. Verbandsdaten-Strategie

## 9.1 Ziel
Die App soll stets aktuelle Tabellen- und Fixture-Daten anzeigen, ohne den Verband bei jedem Request unnötig neu anzufragen.

## 9.2 Cache-Logik
Cache-Dauer: **15 Minuten**

Pseudoablauf für Tabelle oder Fixtures:

1. `league_cache` für `cache_key` laden
2. wenn `expires_at > now()`:
   - Cache zurückgeben
3. sonst:
   - Quelle abrufen
   - XML parsen
   - Daten normalisieren
   - Cache aktualisieren
4. falls Abruf/Parsing scheitert:
   - letzten gültigen Cache zurückgeben, sofern vorhanden
   - Antwort als stale kennzeichnen

## 9.3 Wiederverwendung vorhandener Logik
Der Agent soll die bestehende Import- und Mapping-Logik nicht wegwerfen, sondern in wiederverwendbare Bausteine überführen.

Ziel:
- Parsing-/Mapping-Logik in `shared/league/*`
- CLI-Script für lokale Tests weiterhin möglich
- API verwendet dieselben Parser

---

# 10. Frontend-Migrationsstrategie

## 10.1 Bestehende UI beibehalten, Datenquelle austauschen
Die App soll nicht komplett neu gebaut werden.

Der Agent soll zunächst:
- UI-Komponenten erhalten
- Datenflüsse von Mock/LocalStorage auf API umstellen

## 10.2 Reihenfolge der Frontend-Umstellung
1. Session-Gate ergänzen
2. Spielerliste aus API laden
3. Poll-Liste aus API laden
4. Poll-Detail aus API laden
5. Responses über API schreiben
6. Tabelle über API laden
7. Admin-Funktionen auf API umstellen

## 10.3 LocalStorage abbauen
Nach erfolgreicher Umstellung soll LocalStorage nur noch für Folgendes dienen:
- `activePlayerId`
- evtl. UI-Einstellungen

Nicht mehr für:
- Poll-Daten
- persistente Responses
- Mock-Merge

---

# 11. Arbeitspakete in empfohlener Reihenfolge

Die folgenden Pakete sollen **nacheinander** abgearbeitet werden.

---

## Paket 1 – Infrastruktur vorbereiten

### Ziel
Grundlage für Cloudflare + Supabase schaffen.

### Aufgaben
- Cloudflare-kompatible Serverstruktur vorbereiten
- Supabase-Client für Server und Frontend trennen
- Konfigurationslayer für Env Vars anlegen
- Secrets sauber kapseln

### Deliverables
- `src/api/config.ts`
- Server-Konfiguration
- Supabase-Clients
- README-Abschnitt für benötigte Env Vars

---

## Paket 2 – SQL-Migrationen und Seed-Daten

### Ziel
Relationale Datenbasis herstellen.

### Aufgaben
- SQL-Migrationen schreiben
- Tabellen anlegen
- Constraints und sinnvolle Indizes definieren
- Seed-Daten aus Mock-Daten vorbereiten
- `team_settings` mit Default-Konfiguration vorbereiten

### Deliverables
- `db/migrations/*.sql`
- optional `db/seeds/*.sql` oder Seed-Script
- Dokumentation, wie Mock-Daten als Seed genutzt werden

---

## Paket 3 – Session-/Passwort-Gate implementieren

### Ziel
App vor unbefugtem Zugriff schützen.

### Aufgaben
- `POST /api/session/login`
- `GET /api/session`
- `POST /api/session/logout`
- Team-Passwort serverseitig prüfen
- Passwort gehasht speichern/prüfen
- Session-Cookie setzen/löschen

### Frontend-Aufgaben
- Passwort-Screen bauen
- App-Inhalt erst nach gültiger Session anzeigen

### Deliverables
- funktionierender Passwort-Gate
- Session-Hooks im Frontend
- Cookie-basierte Session

---

## Paket 4 – Spielerwahl integrieren

### Ziel
Nutzer innerhalb der App ihren Spieler auswählen lassen.

### Aufgaben
- `GET /api/players`
- UI für Spielerauswahl
- `activePlayerId` lokal speichern
- Guard: falls kein aktiver Spieler gewählt ist, keine Abstimmungsaktionen erlauben

### Deliverables
- Spielerwahl-Screen oder Modal
- aktive Pill-/Profilanzeige auf bestehender UI-Basis

---

## Paket 5 – Poll-Lesen auf API umstellen

### Ziel
Dashboard und Detailansichten mit echter Datenquelle betreiben.

### Aufgaben
- `GET /api/polls`
- `GET /api/polls/:id`
- Mapper DB -> Frontendmodell
- PlannerContext oder Nachfolger auf API-Lesen umstellen

### Deliverables
- Dashboard läuft mit DB-Daten
- Detailseite läuft mit DB-Daten
- LocalStorage-Merge ist für Poll-Daten deaktiviert oder entfernt

---

## Paket 6 – Responses produktiv machen

### Ziel
Zu-/Absagen teamweit persistent speichern.

### Aufgaben
- `PUT /api/polls/:pollId/responses/:playerId`
- sicherstellen, dass nur der aktive Spieler schreiben darf
- vorhandene AvailabilityButtons auf API umstellen
- Status-/Fehlerhandling ergänzen

### Deliverables
- echte gemeinsame Responses
- Reload über Geräte hinweg konsistent

---

## Paket 7 – Admin-Funktionen produktiv machen

### Ziel
Admin kann Polls sauber verwalten.

### Aufgaben
- `POST /api/polls`
- `PATCH /api/polls/:id`
- `DELETE /api/polls/:id` oder Archivierungsalternative
- Admin-Gates server- und clientseitig
- Formular für Bearbeiten ergänzen, nicht nur Anlegen

### Deliverables
- `/admin` ist nicht mehr nur URL-basiert offen
- Poll-Erstellung/Bearbeitung/Löschen funktioniert produktiv

---

## Paket 8 – Verbandsdaten-API bauen

### Ziel
Tabelle und Fixtures serverseitig laden.

### Aufgaben
- XML-Abruf kapseln
- bestehende Import-Logik in wiederverwendbare Parser extrahieren
- `GET /api/league/table`
- `GET /api/league/fixtures`

### Deliverables
- API liefert normalisierte Daten
- Parsing ist testbar und nicht nur CLI-basiert

---

## Paket 9 – 15-Minuten-Cache und Fallback implementieren

### Ziel
Verbandsschonende und robuste Aktualisierung.

### Aufgaben
- `league_cache` nutzen
- TTL auf 15 Minuten setzen
- stale fallback implementieren
- Fehlerstatus an Frontend zurückgeben

### Deliverables
- Cache funktioniert
- letzter gültiger Stand wird bei Fehlern weitergeliefert
- Metadaten `fetchedAt`, `expiresAt`, optional `isStale`

---

## Paket 10 – Liga-Funktionen im Frontend anbinden

### Ziel
Tabellen-Tab und Fixture-Auswahl produktiv machen.

### Aufgaben
- `/table` auf `GET /api/league/table` umstellen
- Admin-Neuanlage auf `GET /api/league/fixtures` umstellen
- UI-Hinweis für Datenstand anzeigen

### Deliverables
- Tabelle mit Live-/Cache-Daten
- aktuelle Fixtures als Auswahl beim Poll-Anlegen

---

## Paket 11 – Technische Schulden gezielt reduzieren

### Ziel
Nach Stabilisierung aufräumen.

### Aufgaben
- `MatchDay` schrittweise zu `AvailabilityPoll` refactoren
- Soft Delete oder Archivierungsstrategie klarziehen
- Detailseite mobile-first verbessern
- README aktualisieren

### Deliverables
- sauberere Benennungen
- weniger Übergangscode
- aktualisierte Projektdokumentation

---

# 12. Tests und Qualitätssicherung

## 12.1 Mindestanforderungen
Der Agent soll nicht nur Code erzeugen, sondern die kritischen Pfade absichern.

## 12.2 Zu testende Bereiche

### Domain-Tests
- Mixed-Regel
- Mindestanzahl
- Positionsabdeckung
- Ergebnisprojektion

### API-Tests oder mindestens robuste Handler-Tests
- Passwort-Gate
- Session-Prüfung
- Poll-Reads
- Response-Writes
- League-Cache

### UI-/Integrationsprüfungen
- Passwortfluss
- Spielerwahl
- Abstimmen
- Admin-Routen
- Tabellenansicht mit frischem und stale Cache

## 12.3 Agent-Verhalten
Wenn vollständige Tests nicht in einem Schritt machbar sind, soll der Agent:
- zumindest kritische pure Funktionen testen
- sonst klare manuelle Testlisten dokumentieren

---

# 13. Nicht-Ziele für die erste Produktivversion

Diese Themen sind bewusst **nicht** Priorität 1 und sollen nur vorbereitet, aber nicht ausgebaut werden, sofern sie nicht zwingend für die Architektur nötig sind.

- echtes personenbezogenes Login
- Magic Links
- Google Auth
- Firebase Auth / Firestore
- Audit-Log / vollständige Historie
- Mehrfach-Alternativtermine als voll ausgebautes Gruppenmodell
- Push Notifications
- erweiterte Rollenmodelle
- hochkomplexe Offline-Funktionalität

---

# 14. Offene oder nur grob definierte Punkte

Der Agent soll diese Punkte **nicht eigenmächtig überdefinieren**, sondern nur vorbereitend gestalten.

## 14.1 Terminfindung mit mehreren Alternativen
Aktuell nur grob angedacht.

Vorgehen:
- Datenmodell nicht verbauen
- `poll_type = "date-finding"` weiter unterstützen
- aber keine vollständige Gruppierungslogik erzwingen, solange keine klaren Anforderungen vorliegen

## 14.2 Poll-Löschen
Es wurde diskutiert, dass später Soft Delete oder Audit sinnvoller sein kann.

Vorgehen:
- für die erste Version pragmatisch bleiben
- bevorzugt Status-/Archivlösung statt irreversibles Löschen, wenn leicht umsetzbar

---

# 15. Konkrete Umsetzungshinweise an den Agent

## 15.1 Reihenfolge strikt einhalten
Nicht zuerst kosmetische Refactorings machen.  
Zuerst produktionsrelevante Architektur.

## 15.2 Kleine, nachvollziehbare Schritte
Der Agent soll lieber mehrere saubere kleine Änderungen machen als einen riesigen unübersichtlichen Umbau.

## 15.3 Bestehende Fachlogik respektieren
Vor allem die Domänenlogik zu:
- Squad Analysis
- Mixed Rule
- League Projections

nicht neu erfinden, wenn die vorhandene Logik bereits den Produktanforderungen genügt.

## 15.4 Gute Adapter statt globale Umbauten
Wenn bestehende Komponenten auf ein bestimmtes Modellformat angewiesen sind, lieber Mapper/Adapter bauen, statt sofort alles tiefgreifend umzubenennen.

## 15.5 Dokumentation mitführen
Nach jedem größeren Architektur-Schritt README oder Setup-Dokumentation aktualisieren.

---

# 16. Definition of Done für die erste produktiv nutzbare Version

Die erste produktiv nutzbare Version ist erreicht, wenn:

1. die App über Cloudflare ausgeliefert werden kann
2. die App durch ein Team-Passwort geschützt ist
3. Spieler nach Eintritt ihren Namen wählen können
4. Polls und Responses in Supabase persistent gespeichert werden
5. Admin Polls produktiv anlegen/bearbeiten/löschen kann
6. die Tabelle über den serverseitigen Verbandsabruf geladen wird
7. Fixtures beim Anlegen eines Liga-Polls live angeboten werden
8. der 15-Minuten-Cache funktioniert
9. die App ohne LocalStorage als primäre Datenhaltung funktioniert
10. README/Setup-Anleitung aktualisiert ist

---

# 17. Startauftrag an den Agent

Beginne mit den folgenden Schritten in genau dieser Reihenfolge:

1. Analysiere die bestehende Codebasis und identifiziere die minimal nötigen Eingriffspunkte für:
   - API-Einführung
   - Session-Gate
   - Persistenz-Austausch
2. Erstelle die Zielstruktur für:
   - Serverfunktionen
   - Supabase-Zugriff
   - Shared League Parsing
3. Erarbeite SQL-Migrationen für das Zielmodell
4. Erstelle Seed-Daten auf Basis der vorhandenen Mock-Daten
5. Implementiere danach das Team-Passwort-Gate
6. Binde dann Spieler, Polls und Responses an die API an
7. Implementiere anschließend die Verbandsdaten-API mit 15-Minuten-Cache
8. Führe erst danach größere Refactorings wie `MatchDay` -> `AvailabilityPoll` durch

Während der Umsetzung:
- keine neue Produktlogik erfinden
- kein Firebase Auth / Firestore einführen
- keine personenbezogene Benutzer-Auth hinzufügen
- keine direkten Browser-Requests zur Verbands-XML einbauen

