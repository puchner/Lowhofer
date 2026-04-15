# Paket 4 – API und Frontend-Migration

## Ziel
Die bestehende App schrittweise von LocalStorage/Mock-Daten auf die neue API-Schicht umstellen.

## Voraussetzung
Paket 1 ist im Repo umgesetzt. Neue API-Endpunkte werden als Cloudflare Pages Functions unter `functions/api/*` angelegt.
Paket 2 ist im Repo umgesetzt. Das Supabase-Schema liegt unter `supabase/migrations`, die initialen Daten unter `supabase/seeds`, und das zentrale DB-/Frontend-Mapping unter `src/data/supabaseMappers.ts`.
Paket 3 ist im Repo umgesetzt. Session-Endpunkte und `GET /api/players` existieren bereits; Paket 4 soll diese Basis erweitern statt neu aufzubauen.

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
Session-Gate ergänzen

### Schritt 2
Spielerliste aus API laden

### Schritt 3
Poll-Liste und Poll-Details aus API laden

### Schritt 4
AvailabilityButtons auf API-Write umstellen

### Schritt 5
Admin-Aktionen auf API umstellen:
- create
- edit
- archive/delete

## LocalStorage-Abbau
Nach erfolgreicher Umstellung darf LocalStorage nur noch halten:
- letzter aktiver Spieler als UX-Hilfe
- UI-Präferenzen

Nicht mehr:
- Poll-Daten
- Responses
- Merge-Logik für produktive Daten

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
- bestehende UI bleibt weitgehend erhalten

## Hinweise für den Agent
- möglichst keine unnötigen Komplett-Rewrites
- Adapter/Mapper bevorzugen
- `MatchDay`-Alias zunächst tolerieren, solange neue APIs sauber `AvailabilityPoll` modellieren

## Free-Plan-Einschätzung
Dieses Paket bleibt kostenlos realistisch:
- wenig API-Aufrufe
- sehr geringe DB-Last
- keine Frontend-Direct-DB-Zugriffe nötig
