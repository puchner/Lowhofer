# Kalender-/Terminmodell Cutover Plan

Ziel: Das aktuelle Poll-zentrierte Modell wird auf ein fachlich getrenntes Modell umgestellt:

- `matches` = stabile Spielidentität
- `match_appointments` = konkreter oder möglicher Termin eines Matches
- `availability_polls` = Verfügbarkeitsabfrage zu genau einem Termin
- `availability_responses` = Antworten zu einer Poll

Der Umbau ist als kompletter App-/API-Cutover geplant. Die bestehenden produktiven Daten werden vorab lokal mit einem aktuellen Produktiv-Snapshot migriert und geprüft.

## Leitentscheidungen

- [ ] `GameNr` aus dem Verbands-XML wird als externe Match-Identität verwendet.
- [ ] Technische Match-ID bleibt eine interne UUID.
- [ ] Liga-Matches werden perspektivisch eindeutig über `source_type + season_key + team_key + league_game_nr`.
- [ ] `opponent_name` und `home_away` sind Attribute, nicht die technische Match-ID.
- [ ] Polls hängen künftig an `match_appointments`, nicht direkt an Matches.
- [ ] Kalenderlogik liest ausschließlich aus `match_appointments`.
- [ ] `planned` Termine werden nicht in den Kalender exportiert.
- [ ] `scheduled` Termine werden in den Kalender exportiert.
- [ ] `cancelled` Termine werden zunächst entweder ausgelassen oder später explizit als abgesagt exportiert.
- [ ] `availability_polls` und `availability_responses` bleiben fachlich erhalten.
- [ ] Legacy-Spalten in `availability_polls` werden im ersten Cutover nach Möglichkeit noch nicht gelöscht.

## Paket 1: DB-Zielmodell

- [x] Neue Migration für `matches` anlegen.
- [x] Neue Migration für `match_appointments` anlegen.
- [x] `availability_polls.match_appointment_id` hinzufügen.
- [x] `matches.legacy_poll_id` als Migrationshilfe hinzufügen.
- [x] `match_appointments.legacy_poll_id` als Migrationshilfe hinzufügen.
- [x] `updated_at` Trigger für `matches` hinzufügen.
- [x] `updated_at` Trigger für `match_appointments` hinzufügen.
- [x] RLS für neue Tabellen aktivieren.
- [x] Index auf `matches(source_type, season_key, team_key, league_game_nr)` hinzufügen.
- [x] Index auf `match_appointments(match_id)` hinzufügen.
- [x] Index auf `match_appointments(status, starts_at)` hinzufügen.
- [x] Index auf `availability_polls(match_appointment_id)` hinzufügen.

Vorgesehene Felder `matches`:

```text
id uuid primary key
source_type text -- league/custom
league_game_nr text null
season_key text null
team_key text null
opponent_name text not null
home_away text not null
notes text null
legacy_poll_id uuid null
created_at timestamptz
updated_at timestamptz
```

Vorgesehene Felder `match_appointments`:

```text
id uuid primary key
match_id uuid not null references matches(id)
starts_at timestamptz null
has_time boolean not null default true
status text not null -- planned/scheduled/cancelled
location text null
source_type text not null -- league/custom
cancelled_at timestamptz null
cancellation_reason text null
legacy_poll_id uuid null
created_at timestamptz
updated_at timestamptz
```

## Paket 2: Backfill Bestehender Daten

- [x] Bestehende `poll_type = 'match'` Polls in `matches` transformieren.
- [x] Polls mit `league_fixture_external_id` über `league_game_nr` zusammenführen.
- [x] Polls ohne `league_fixture_external_id` konservativ als eigenes `custom` Match migrieren.
- [x] Bestehende `poll_type = 'match'` Polls als `scheduled` Appointment migrieren.
- [x] Bestehende `poll_type = 'date-finding'` Polls als `planned` Appointment migrieren, falls sie einen konkreten Termin repräsentieren.
- [ ] Bedeutung von `poll_status = 'cancelled'` anhand Snapshot prüfen.
- [x] Falls fachlich korrekt: `poll_status = 'cancelled'` zu Appointment-Status `cancelled` migrieren.
- [x] `availability_polls.match_appointment_id` für alle migrierten Polls setzen.
- [x] `availability_responses` unverändert lassen.
- [x] Backfill idempotent bauen, damit erneutes Ausführen keine Duplikate erzeugt.

Validierungsqueries nach Backfill:

```sql
select count(*)
from public.availability_polls
where match_appointment_id is null;
```

```sql
select count(*)
from public.availability_polls p
left join public.match_appointments a on a.id = p.match_appointment_id
left join public.matches m on m.id = a.match_id
where a.id is null or m.id is null;
```

```sql
select count(*)
from public.availability_responses r
left join public.availability_polls p on p.id = r.poll_id
where p.id is null;
```

```sql
select status, count(*)
from public.match_appointments
group by status
order by status;
```

## Paket 3: Backend-Datenzugriff

- [x] DB-Typen für `matches` ergänzen.
- [x] DB-Typen für `match_appointments` ergänzen.
- [x] Supabase-Helper zum Lesen von Polls mit Match und Appointment ergänzen.
- [x] Supabase-Helper zum Upsert von Liga-Matches ergänzen.
- [x] Supabase-Helper zum Erstellen von Custom-Matches ergänzen.
- [x] Supabase-Helper zum Erstellen/Aktualisieren von Appointments ergänzen.
- [x] Supabase-Helper zum Erstellen von Polls mit `match_appointment_id` ergänzen.
- [x] Bestehendes Poll-Mapping auf neues Join-Modell umstellen.
- [x] API-Response zunächst frontendkompatibel halten.
- [x] Legacy-Fallback nur dort behalten, wo Snapshot-Test Alt-Daten ohne Appointment zeigt.

## Paket 4: Poll-API Umstellung

- [x] `GET /api/polls` liest aus `availability_polls -> match_appointments -> matches`.
- [x] `GET /api/polls/:pollId` liest aus dem neuen Join-Modell.
- [x] `POST /api/polls` aus Liga-Fixture macht `match` Upsert per `GameNr`.
- [x] `POST /api/polls` aus Liga-Fixture erzeugt/ordnet `scheduled` Appointment zu.
- [x] `POST /api/polls` manuell erzeugt `custom` Match.
- [x] `POST /api/polls` manuell erzeugt Appointment.
- [x] `POST /api/polls` erzeugt Poll mit `match_appointment_id`.
- [x] `POST /api/polls` erzeugt weiterhin initiale Responses für aktive Spieler.
- [x] `PATCH /api/polls/:pollId` trennt Poll-Felder von Match-/Termin-Feldern.
- [x] `PATCH /api/polls/:pollId` schreibt `title`, `poll_status`, `archived_at` an Poll.
- [x] `PATCH /api/polls/:pollId` schreibt Datum/Uhrzeit/Ort an Appointment.
- [x] `PATCH /api/polls/:pollId` schreibt Gegner/Heim-Auswärts an Match.
- [x] `DELETE /api/polls/:pollId` löscht nur Poll und Responses.
- [x] Verhalten verwaister Appointments nach Poll-Löschung bewusst entscheiden.
- [x] `PUT /api/polls/:pollId/response` unverändert gegen `availability_responses` betreiben.

## Paket 5: Frontend-Minimalumbau

- [x] Domain-Typen um `matchId` ergänzen.
- [x] Domain-Typen um `appointmentId` ergänzen.
- [x] Domain-Typen um `appointmentStatus` ergänzen.
- [x] Domain-Typen optional um `leagueGameNr` ergänzen.
- [x] Bestehenden `MatchDay` API-Shape zunächst kompatibel halten.
- [x] Dashboard gegen neue API prüfen.
- [x] Detailseite gegen neue API prüfen.
- [x] Edit-Poll-Seite gegen getrennte Match-/Termin-/Poll-Felder prüfen.
- [x] New-Poll-Seite für Liga-Fixtures weiter nutzbar halten.
- [x] Manuelle Poll-Erstellung weiter nutzbar halten.
- [x] UI-Begriffe nur minimal ändern, damit Cutover klein bleibt.

## Paket 6: Liga-Fixture-Integration

- [x] Prüfen, dass `gamenr` weiterhin als `fixture.id` geliefert wird.
- [x] Saison-Key aus Liga-URL ableiten oder initial nullable lassen.
- [x] `team_key` initial fest definieren, z. B. `lowhofer`.
- [x] Beim Anlegen aus Fixture `league_game_nr = fixture.id` setzen.
- [x] Gegner und Heim/Auswärts als Match-Attribute speichern.
- [x] Datum/Uhrzeit als Appointment-Daten speichern.
- [x] Doppelte Poll-Anlage für bereits bestehende Fixture/Appointment verhindern.

## Paket 7: ICS-MVP

- [x] Neuen Endpoint für Kalenderexport anlegen, z. B. `/api/calendar.ics`.
- [x] Appointments mit `status = 'scheduled'` lesen.
- [x] `planned` Appointments nicht exportieren.
- [x] `cancelled` zunächst auslassen oder bewusst als `STATUS:CANCELLED` exportieren.
- [x] Stabile ICS UID aus `match_appointments.id` bilden.
- [x] Titel aus Match-Gegner und Heim/Auswärts bilden.
- [x] Startzeit aus `match_appointments.starts_at` bilden.
- [x] Ort aus `match_appointments.location` übernehmen.
- [x] `text/calendar; charset=utf-8` Header setzen.
- [ ] Kalender lokal abonnierbar/abrufbar testen.

## Paket 8: Lokaler Snapshot-Test

- [ ] Aktuellen Produktiv-Snapshot exportieren.
- [ ] Lokale frische Supabase/Postgres-DB vorbereiten.
- [ ] Produktiv-Snapshot lokal einspielen.
- [ ] Neue Migration auf lokalem Snapshot ausführen.
- [ ] Backfill-Validierungsqueries ausführen.
- [ ] Unerwartete `match_appointment_id is null` Fälle analysieren.
- [ ] Duplikate bei Liga-Matches prüfen.
- [ ] Statusverteilung der Appointments prüfen.
- [ ] Neue App lokal gegen migrierte DB starten.
- [ ] Login lokal testen.
- [ ] Dashboard lokal testen.
- [ ] Bestehende Abstimmungsdetailseite lokal testen.
- [ ] Antwortänderung lokal testen.
- [ ] Poll-Bearbeitung lokal testen.
- [ ] Poll aus Liga-Spielplan lokal testen.
- [ ] Manuelle Poll-Erstellung lokal testen.
- [ ] Poll-Schließen/Archivieren lokal testen.
- [ ] Poll-Löschen lokal testen.
- [ ] ICS-Endpoint lokal testen.
- [ ] Kalenderdatei mit einem Kalenderclient oder Validator prüfen.

## Paket 9: Produktions-Cutover

- [ ] Wartungsfenster festlegen.
- [ ] Wartungsmodus oder Write-Sperre vorbereiten.
- [ ] Direkt vor Cutover Produktiv-Backup/Snapshot erstellen.
- [ ] Migration in Produktion ausführen.
- [ ] Validierungsqueries in Produktion ausführen.
- [ ] Neue App/API deployen.
- [ ] Produktions-Smoke-Test: Login.
- [ ] Produktions-Smoke-Test: Dashboard.
- [ ] Produktions-Smoke-Test: Detailseite.
- [ ] Produktions-Smoke-Test: Antwort ändern.
- [ ] Produktions-Smoke-Test: Poll aus Liga-Spielplan anlegen, falls vertretbar.
- [ ] Produktions-Smoke-Test: ICS abrufen.
- [ ] Wartungsmodus deaktivieren.
- [ ] Nach Cutover relevante Logs prüfen.

## Paket 10: Rollback-Plan

- [ ] Vor Cutover Restore-Prozess kennen und dokumentieren.
- [ ] Legacy-Spalten im ersten Produktiv-Cutover behalten.
- [ ] Falls App-Deploy fehlschlägt: alten App-Code zurückrollen.
- [ ] Falls Migration fehlschlägt: Migration stoppen und Backup/Restore-Entscheidung treffen.
- [ ] Falls Datenvalidierung fehlschlägt: nicht online gehen, Ursache lokal reproduzieren.
- [ ] Cleanup-Drops erst nach erfolgreichem Produktivlauf ausführen.

## Paket 11: Cleanup Nach Stabilitätsphase

- [ ] Prüfen, dass keine App-Queries mehr Legacy-Spalten nutzen.
- [ ] Prüfen, dass alle relevanten Polls `match_appointment_id` haben.
- [ ] Prüfen, dass ICS ausschließlich `match_appointments` nutzt.
- [ ] Prüfen, dass neue Poll-Erstellung nur noch neues Modell schreibt.
- [ ] Optional `availability_polls.starts_at` droppen.
- [ ] Optional `availability_polls.location` droppen oder Bedeutung neu bewerten.
- [ ] Optional `availability_polls.home_away` droppen.
- [ ] Optional `availability_polls.opponent_name` droppen.
- [ ] Optional `availability_polls.source_type` droppen.
- [ ] Optional `availability_polls.league_fixture_external_id` droppen.
- [ ] Optional `availability_polls.poll_type` droppen, wenn vollständig durch Appointment-Status ersetzt.
- [ ] Optional `legacy_poll_id` aus `matches` droppen.
- [ ] Optional `legacy_poll_id` aus `match_appointments` droppen.
- [ ] Nicht droppen: `availability_polls`.
- [ ] Nicht droppen: `availability_responses`.

## Akzeptanzkriterien

- [ ] Bestehende Polls sind nach Migration sichtbar.
- [ ] Bestehende Responses bleiben erhalten.
- [ ] Jede fachlich relevante Poll verweist auf genau einen Appointment.
- [ ] Jeder Appointment verweist auf genau ein Match.
- [ ] Liga-Polls verwenden `GameNr` als externe Match-Identität.
- [ ] Neue manuelle Polls erzeugen Custom-Match und Appointment.
- [ ] `scheduled` Appointments erscheinen im ICS-Export.
- [ ] `planned` Appointments erscheinen nicht im ICS-Export.
- [ ] Dashboard, Detailseite und Antwortänderung funktionieren nach Cutover.
- [ ] Produktiv-Cutover ist mit Backup und Smoke-Test abgesichert.
