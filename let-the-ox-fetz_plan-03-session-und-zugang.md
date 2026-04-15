# Paket 3 – Session, Team-Passwort und Spielerwahl

## Status
Im Repo umgesetzt.

Erstellt wurden:
- `functions/_shared/password.ts`
- `functions/_shared/session.ts`
- `functions/_shared/supabase.ts`
- `functions/api/session/index.ts`
- `functions/api/session/login.ts`
- `functions/api/session/player.ts`
- `functions/api/session/logout.ts`
- `functions/api/players.ts`
- `src/session/*`
- `scripts/createPasswordHash.mjs`

Fachlich gesetzt:
- Pia und Volker sind im Seed Admins.
- Die Spieler-UUIDs der Mock-Daten wurden an den Seed angeglichen, damit Session-Spielerwahl und lokale MVP-Daten bis Paket 4 konsistent bleiben.

Noch außerhalb der IDE offen:
- Team-Passwort festlegen
- Passwort-Hash mit `npm run hash:password -- "DEIN_TEAM_PASSWORT"` erzeugen
- Seed-Platzhalter `REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3` ersetzen oder `team_settings.team_password_hash` nach dem Seed per SQL aktualisieren
- Seed in Supabase ausführen
- `SESSION_SECRET`, `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare setzen bzw. prüfen

## Ziel
Die App mit einem gemeinsamen Team-Passwort schützen und danach den aktiv ausgewählten Spieler **serverseitig** an die Session binden.

## Voraussetzung
Paket 1 ist im Repo umgesetzt. Session-Endpunkte sollen als Cloudflare Pages Functions unter `functions/api/session/*` entstehen.
Paket 2 ist im Repo vorbereitet: `team_settings.team_password_hash` existiert in Supabase, der Seed enthält bis zur Passwortentscheidung den Platzhalter `REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3`.

## Verbindliche Produktentscheidung
- Kein individuelles Login pro Person
- Kein E-Mail-/Google-/Magic-Link-Login
- Gemeinsames Team-Passwort
- Danach Spielerauswahl
- `is_admin` bleibt bewusst **nur vertrauensbasiert innerhalb des Teams**

## Sehr wichtige Korrektur zum alten Plan
`selectedPlayerId` darf nicht nur im LocalStorage liegen.

### Stattdessen:
Nach der Spielerauswahl wird der Spieler serverseitig in die Session übernommen.

## Session-Modell

### Stufe 1 – Team-Login
`POST /api/session/login`

Input:
- `password`

Verhalten:
- Passwort gegen `team_password_hash` prüfen
- gültige Team-Session erzeugen
- httpOnly-Cookie setzen

### Stufe 2 – Spieler auswählen
`POST /api/session/player`

Input:
- `playerId`

Verhalten:
- nur mit gültiger Team-Session
- prüfen, ob Spieler aktiv existiert
- `selectedPlayerId` in Session speichern

### Session-Speicherung
Für den MVP wird keine serverseitige Session-Datenbank und kein Cloudflare KV/Durable Object vorausgesetzt.

Stattdessen:
- stateless Session als signiertes httpOnly-Cookie
- Cookie-Payload enthält mindestens:
  - `isAuthenticated`
  - `selectedPlayerId`
  - `expiresAt`
- Signatur mit `SESSION_SECRET`
- Cookie mit `Secure`, `HttpOnly`, `SameSite=Lax`
- in lokaler Entwicklung darf `Secure` abhängig von der Umgebung deaktiviert werden

### Session lesen
`GET /api/session`

Antwort:
- `isAuthenticated`
- `selectedPlayerId`
- `selectedPlayerDisplayName`
- `selectedPlayerIsAdmin`

### Logout
`POST /api/session/logout`

## LocalStorage-Rolle
LocalStorage darf genutzt werden für:
- UX-Merkhilfe, welcher Spieler zuletzt gewählt war

Aber:
- nicht als Sicherheitsquelle
- nicht als alleinige Quelle für Schreibrechte

## Admin-Bedeutung
`is_admin` reicht bewusst aus.  
Das bedeutet ausdrücklich:

- Admin ist gegen Außenstehende ohne Team-Passwort geschützt
- Admin ist **nicht** hart gegen andere Teammitglieder mit Team-Passwort geschützt

Diese Systemgrenze soll dokumentiert, aber nicht technisch weiter gehärtet werden.

## Passwort-Hashing
Für Cloudflare-konforme, schlanke Umsetzung:
- WebCrypto
- PBKDF2
- Salt
- sicherer Vergleich

Zusätzlich einplanen:
- `SESSION_SECRET` als Secret/Env Var
- Session-Cookie signieren oder robust absichern
- erzeugten Passwort-Hash in `team_settings.team_password_hash` eintragen bzw. den Seed vor Ausführung ersetzen

## Aufgaben des Nutzers außerhalb der IDE

Der Agent kann Hashing und Session-Code vorbereiten, aber diese Punkte muss der Nutzer liefern oder im Dashboard setzen:

- Team-Passwort festlegen
- `SESSION_SECRET` als ausreichend langes zufälliges Secret erzeugen oder freigeben
- `SESSION_SECRET` in Cloudflare als Secret hinterlegen
- initialen Passwort-Hash bzw. Seed im Supabase-Projekt freigeben; im vorbereiteten Seed steht aktuell `REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3`
- Team intern über den bewusst vertrauensbasierten Admin-Modus informieren

## Frontend-Aufgaben
- Passwort-Gate vor der App
- Spielerauswahl-Screen oder Modal
- Session-Status zentral laden
- aktiven Spieler sichtbar anzeigen
- bewusster Spielerwechsel

## Deliverables
- [x] funktionierendes Team-Passwort-Gate
- [x] `selectedPlayerId` serverseitig in Session
- [x] Session-Endpunkte
- [x] Frontend-Gate und Spielerauswahl
- [x] dokumentierter Admin-Vertrauensmodus

## Hinweise für den Agent
- Keine `playerId` für den Response-Write aus LocalStorage „vertrauen“
- Session ist die Quelle für den aktiven Spieler
- `is_admin` nicht künstlich als starker Schutz verkaufen

## Free-Plan-Einschätzung
Dieses Paket bleibt im Free-Tier-Rahmen:
- sehr geringe Worker-Last
- keine Zusatzprodukte nötig
