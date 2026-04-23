# Let the Ox Fetz – Implementierungspläne (Übersicht)

Diese Sammlung ist für einen AI-Coding-Agent in der IDE formuliert.  
Sie ersetzt den bisherigen Einzelplan durch mehrere thematisch getrennte Pläne.

## Verbindliche Leitentscheidungen

- Hosting: **Cloudflare Pages**
- Serverlogik / API: **Cloudflare Pages Functions**
- Datenbank: **Supabase (Postgres)**
- Kein Firebase Auth
- Kein Firestore
- Kein personenbezogenes Login via E-Mail / Google / Magic Link
- Zugangsschutz: **gemeinsames Team-Passwort**
- Danach wählt der Nutzer seinen **Spieler**
- `selectedPlayerId` darf **nicht nur im LocalStorage** liegen, sondern muss serverseitig in die Session übernommen werden
- Session wird für den MVP als **stateless signiertes httpOnly-Cookie** umgesetzt; kein Cloudflare KV, D1 oder Durable Object voraussetzen
- `is_admin` bleibt bewusst **vertrauensbasiert** innerhalb des Teams
- Verbandsdaten werden serverseitig geladen und **15 Minuten gecacht**
- `homeAway` ist ein **eigenes fachliches Feld** und darf nicht aus dem Ort abgeleitet werden
- `homeAway` verwendet für den MVP die Werte `home`, `away`, `unknown`
- Standardzeitzone für fachliche Terminverarbeitung: **Europe/Berlin**
- API ist die **Quelle der Wahrheit**
- Das Frontend spricht für MVP-Geschäftsdaten **nicht direkt mit Supabase**

## Paketübersicht

1. `01-cloudflare-umstellung.md`
   - Plattform- und Repo-Umstellung von Firebase-orientiert zu Cloudflare-orientiert
   - Status: erledigt; Cloudflare ist angebunden und das Projekt ist mit dem GitHub-Repo verbunden

2. `02-datenmodell-und-supabase.md`
   - Ziel-Datenmodell, Migrationen, Constraints, Seeds, Zeitzone, `homeAway`
   - Status: erledigt; Supabase-Migration und Seed sind ausgeführt

3. `03-session-und-zugang.md`
   - Team-Passwort, Session, Spielerwahl, serverseitige Speicherung des aktiven Spielers
   - Status: erledigt; produktiver Login wurde erfolgreich getestet

4. `04-api-und-frontend-migration.md`
   - API-Endpunkte, Umstellung der bestehenden App von LocalStorage auf API, kombinierter Login-/Spielerfluss, Admin-Funktionen ohne separate Admin-URLs
   - Status: im Repo umgesetzt; produktiver Cloudflare-/Supabase-Test steht noch aus

5. `05-verbandsdaten-und-cache.md`
   - XML-Abruf, Parser, 15-Minuten-Cache, Fallback auf letzten gültigen Stand
   - Status: erledigt

6. `06-tests-polish-und-definition-of-done.md`
   - Testsetup, Qualitätssicherung, Refactoring-Restarbeiten, Abschlusskriterien
   - Status: offen

## Kosten- und Free-Plan-Einschätzung

Die geplanten Änderungen bleiben für euren Umfang weiterhin im wahrscheinlichen Gratisbetrieb:

- Cloudflare Pages Free: 500 Builds/Monat, unbegrenzte statische Requests und Bandbreite
- Cloudflare Workers Free: 100.000 Requests pro Tag
- Supabase: Free Plan vorhanden

Für 14 Personen, seltene Parallelität, wenige Polls und einen 15-Minuten-Cache ist das weiterhin sehr deutlich innerhalb des erwartbaren Free-Tier-Rahmens.

## Wichtige Grenzen des Systems

- `is_admin` ist innerhalb des Teams **kein harter Schutz**
- Wer das Team-Passwort kennt, kann auch den Admin-Spieler auswählen
- Das ist bewusst so entschieden und muss dokumentiert, aber nicht „wegdesignt“ werden
- Admin ist kein eigener URL-Bereich als Produktmodell; Admin-Funktionen werden im normalen UI eingeblendet, wenn der aktive Session-Spieler Admin ist

## Aufgaben außerhalb der IDE

Diese Punkte kann der Agent vorbereiten oder dokumentieren, aber nicht vollständig selbst erledigen:

- GitHub-Repository anlegen und lokalen Stand pushen, falls keine lokale GitHub-Authentifizierung vorhanden ist
- Cloudflare-Konto und Cloudflare-Pages-Projekt anlegen
- GitHub-Repository mit Cloudflare Pages verbinden
- Supabase-Projekt anlegen und Projektwerte aus dem Dashboard entnehmen (erledigt)
- Cloudflare-Secrets setzen, insbesondere `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` und `SESSION_SECRET` (erledigt)
- Team-Passwort festlegen und den initialen Passwort-Hash bzw. Seed freigeben (erledigt)
- initiale Spielerliste ist bestätigt; Pia und Volker sind im Seed Admins (erledigt)
- SQL-Migration `supabase/migrations/202604150001_create_core_schema.sql` und Seed `supabase/seeds/001_initial_lowhofer_data.sql` im Supabase-Projekt ausführen oder einen Migrationsworkflow verbinden (erledigt)
- ersten produktiven Cloudflare-Deploy auslösen und in Cloudflare/Supabase-Dashboards prüfen
- finalen Link ans Team verteilen

## Empfohlene Umsetzungsreihenfolge

1. Cloudflare-Umstellung: erledigt
2. Supabase-Datenmodell + Migrationen + Seeds: erledigt
3. Session-/Passwort-Gate + Spielerwahl in Session: erledigt
4. Polls/Responses/Spieler auf API umstellen und dabei Login-/Spielerfluss sowie Admin-UI konsolidieren: im Repo erledigt; extern produktiv testen
5. Verbandsdaten-API + Cache
6. Tests, Doku, Rest-Refactorings
