# Paket 4 – API und Frontend-Migration

## Ziel
Die bestehende App schrittweise von LocalStorage/Mock-Daten auf die neue API-Schicht umstellen.

Zusätzlich wird in diesem Paket der nach Paket 3 erkannte Ziel-Workflow korrigiert:
- Login und Spielerwahl sollen fachlich als ein zusammenhängender Einstieg wirken
- der aktive Spieler soll nach Login nicht frei im Header wechselbar sein
- Admin-Funktionen sollen nicht über separate Admin-URLs modelliert werden, sondern im normalen UI sichtbar werden, sobald der aktive Session-Spieler Admin ist

## Voraussetzung
Paket 1 ist im Repo umgesetzt. Neue API-Endpunkte werden als Cloudflare Pages Functions unter `functions/api/*` angelegt.
Paket 2 ist im Repo umgesetzt. Das Supabase-Schema liegt unter `supabase/migrations`, die initialen Daten unter `supabase/seeds`, und das zentrale DB-/Frontend-Mapping unter `src/data/supabaseMappers.ts`.
Paket 3 ist im Repo umgesetzt. Session-Endpunkte und `GET /api/players` existieren bereits; Paket 4 soll diese Basis erweitern statt neu aufzubauen.

## Workflow-Korrektur aus Paket 3

Diese Anpassung wird bewusst in Paket 4 umgesetzt und nicht als eigenes Zwischenpaket angelegt.

Grund:
- Paket 4 baut ohnehin die API- und Frontend-Datenflüsse neu auf
- Response-Writes müssen serverseitig aus `selectedPlayerId` kommen
- Admin-Aktionen müssen serverseitig aus `selectedPlayerIsAdmin` bzw. DB-Adminstatus abgeleitet werden
- ein späterer Umbau von separaten Admin-Routen und freiem Spielerwechsel würde unnötig doppelte Arbeit erzeugen

### Neuer Login-/Spielerfluss

Ziel:
- Nutzer öffnet die App
- Nutzer wählt seinen Spieler und gibt das Team-Passwort ein
- erfolgreicher Login setzt direkt `selectedPlayerId` in der signierten Session
- danach ist der aktive Spieler sichtbar, aber nicht frei wechselbar
- Spielerwechsel erfolgt nur über Logout

UI-Text:
- Statt `Abmelden` bevorzugt: `Ich bin nicht <Name>`
- Klick darauf beendet die Session und führt zurück zur Login-/Spielerwahl

Technische Konsequenz:
- `POST /api/session/login` soll optional `playerId` akzeptieren und bei gültigem Passwort direkt in die Session schreiben
- `POST /api/session/player` kann für Kompatibilität vorerst bestehen bleiben, soll aber nicht mehr der primäre Frontend-Flow sein
- LocalStorage darf weiterhin höchstens den zuletzt gewählten Spieler als Vorauswahl merken, aber nicht als Quelle für Schreibrechte

### Neuer Admin-Flow

Ziel:
- Keine eigene Admin-Navigation als primäres Produktmodell
- Keine separaten Admin-Dashboards als Ziel-UX
- Admin-Funktionen werden im normalen Dashboard, in Poll-Details und in passenden Formularen eingeblendet, wenn der aktive Session-Spieler Admin ist

Technische Konsequenz:
- `/admin` und `/admin/*` sollen entfernt oder auf die normalen Routen umgeleitet werden
- Frontend prüft Adminstatus nur zur Darstellung
- API prüft Adminstatus serverseitig vor `POST`, `PATCH`, `DELETE` bzw. Archiv-Aktionen

## Leitprinzip
API ist die Quelle der Wahrheit.

### Konsequenz
Für den MVP:
- kein direkter Supabase-Client im Frontend für Geschäftsdaten
- keine `VITE_SUPABASE_*` für Polls/Responses/Spieler nötig
- Browser spricht mit `/api/*`
- API spricht mit Supabase

## API-Zielbild

### Session
- [x] `GET /api/session`
- [x] `POST /api/session/login`
- [x] `POST /api/session/player`
- [x] `POST /api/session/logout`

Paket-4-Anpassung:
- `POST /api/session/login` um `playerId` erweitern, damit Login und Spielerwahl in einem Schritt möglich sind
- Frontend soll `POST /api/session/player` nicht mehr als normalen Wechselmechanismus verwenden

### Spieler
- [x] `GET /api/players`
- `POST /api/players` (admin)
- `PATCH /api/players/:id` (admin)

### Polls
- `GET /api/polls`
- `GET /api/polls/:id`
- `POST /api/polls` (admin)
- `PATCH /api/polls/:id` (admin)
- `DELETE /api/polls/:id` oder Status-/Archivlösung (admin)

### Responses
Wichtige Anpassung:
- statt `PUT /api/polls/:pollId/responses/:playerId`
- lieber `PUT /api/polls/:pollId/response`

Der Spieler wird serverseitig aus der Session ermittelt.

### Schreibregel
- nur gültige Team-Session
- nur wenn `selectedPlayerId` in Session gesetzt ist
- keine fremde `playerId` akzeptieren

## Frontend-Migrationsreihenfolge

### Schritt 1
Session-Gate auf kombinierten Login umbauen:
- Spielerwahl und Passwort in einem Einstieg
- keine freie Spieler-Auswahl im Header nach Login
- Header zeigt aktiven Spieler und `Ich bin nicht <Name>`

### Schritt 2
Admin-Routen abbauen:
- `/admin` und `/admin/*` entfernen oder auf normale Routen umleiten
- Admin-Funktionen auf normalen Seiten bedingt anzeigen

### Schritt 3
Spielerliste aus API laden und als Grundlage für Login-Vorauswahl und Kaderansicht nutzen

### Schritt 4
Poll-Liste und Poll-Details aus API laden

### Schritt 5
AvailabilityButtons auf API-Write umstellen:
- kein `playerId` aus dem Frontend senden
- API nutzt `selectedPlayerId` aus Session

### Schritt 6
Admin-Aktionen auf API umstellen:
- create
- edit
- archive/delete
- Adminrechte serverseitig prüfen

## LocalStorage-Abbau
Nach erfolgreicher Umstellung darf LocalStorage nur noch halten:
- letzter aktiver Spieler als Login-Vorauswahl
- UI-Präferenzen

Nicht mehr:
- Poll-Daten
- Responses
- Merge-Logik für produktive Daten
- aktiver Spieler als Schreibrechte-Quelle

## Bestehende Domain-Logik
Die fachliche Analyse soll erhalten bleiben:
- `analyzeSquad.ts`
- `lineup.ts`
- `squadRules.ts`
- `leagueTable.ts`

Diese Dateien sollen über Mapper/API-Daten gespeist werden, aber keine Infrastruktur kennen.
Das bereits angelegte Mapping in `src/data/supabaseMappers.ts` soll dafür genutzt oder serverseitig gespiegelt werden, statt neue Status-/Datums-Mappings verteilt einzubauen.

## Deliverables
- Polls/Spieler/Responses laufen über API
- PlannerContext oder Nachfolger nutzt API statt LocalStorage als Primärquelle
- Login wählt Spieler und Passwort zusammen
- aktiver Spieler ist nach Login nicht frei wechselbar
- Admin-Funktionen sind in normalen Routen integriert statt über separaten Admin-Bereich
- bestehende UI bleibt in Layout und Fachlogik weitgehend erhalten

## Hinweise für den Agent
- möglichst keine unnötigen Komplett-Rewrites
- Adapter/Mapper bevorzugen
- `MatchDay`-Alias zunächst tolerieren, solange neue APIs sauber `AvailabilityPoll` modellieren
- keine `playerId` aus Availability-Write-Requests akzeptieren
- Admin-Routen nicht weiter ausbauen; normale Routen mit bedingten Admin-Aktionen bevorzugen

## Free-Plan-Einschätzung
Dieses Paket bleibt kostenlos realistisch:
- wenig API-Aufrufe
- sehr geringe DB-Last
- keine Frontend-Direct-DB-Zugriffe nötig
