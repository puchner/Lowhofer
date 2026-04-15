# Paket 6 – Tests, Polish und Definition of Done

## Ziel
Die produktiv relevante Basis absichern, Restschulden gezielt abbauen und eine klare Definition of Done festlegen.

## Test-Setup
Da der bisherige Stand noch kein klares Test-Setup hat, soll ein kleines bewusstes Testpaket eingeführt werden.

### Empfehlung
- Vitest als minimales Test-Framework

## Priorisierte Testbereiche

### 1. Domain-Tests
- Mixed-Regel
- Mindestanzahl
- Rollen-/Positionsabdeckung
- Ergebnisprojektionen

### 2. Parser-/League-Tests
- XML-Mapping für Tabelle
- XML-Mapping für Fixtures
- Fallback-Verhalten

### 3. Session-/Handler-Tests
- Passwortprüfung
- Session-Auslesen
- Spielerwahl in Session
- Response-Write nur mit gesetztem `selectedPlayerId`

### 4. UI-/Integrationsprüfungen
Mindestens dokumentierte manuelle Tests:
- Passwort-Gate
- Spielerwahl
- Abstimmen
- Admin-Poll-Erstellung
- Tabellen-Tab
- Fixture-Auswahl
- Reload / neues Gerät

## Technische Schulden nach Priorität

### Hoch
- README aktualisieren
- Session-/API-Doku ergänzen
- alte Setup-Dokumente mit den neuen Cloudflare-/Supabase-Entscheidungen abgleichen

Bereits durch Paket 1 erledigt:
- Firebase-Konfigurationsdateien und Firebase-Deploy-Skripte entfernt
- README und Setup-Dokumentation auf Cloudflare Pages aktualisiert

Bereits durch Paket 2 erledigt:
- Supabase-Migration und initialer Seed unter `supabase/` ergänzt
- zentrale DB-/Frontend-Mapper in `src/data/supabaseMappers.ts` ergänzt
- README und Setup-Dokumentation um Supabase-Schritte erweitert

Bereits durch Paket 3 erledigt:
- Team-Passwort-Gate, Session-Endpunkte und Spielerwahl ergänzt
- stateless signiertes httpOnly-Cookie für `selectedPlayerId` umgesetzt
- Passwort-Hash-Script `npm run hash:password` ergänzt
- Pia und Volker als initiale Admins im Seed gesetzt

### Mittel
- `MatchDay` schrittweise in `AvailabilityPoll` überführen
- Detailseite mobile-first verbessern
- Poll-Bearbeitung komfortabler machen

### Niedrig / spätere Version
- Gruppierte Terminfindung mit mehreren Alternativen
- Soft Delete / Audit-Log weiter ausbauen
- weitere UX-Verbesserungen

## Definition of Done – erste produktiv nutzbare Version

Die erste Version gilt als fertig, wenn:

1. die App über Cloudflare Pages läuft
2. die App durch Team-Passwort geschützt ist
3. der aktive Spieler serverseitig in der Session gespeichert wird
4. Spieler, Polls und Responses in Supabase persistieren; Schema und Seed sind vorbereitet, API-Anbindung folgt in Paket 4
5. Responses nur für den aktuell in der Session gewählten Spieler geschrieben werden
6. Admin Polls anlegen/bearbeiten/löschen bzw. archivieren kann
7. `homeAway` korrekt persistiert und genutzt wird
8. Liga-Tabelle über serverseitige API geladen wird
9. Fixtures serverseitig geladen und beim Anlegen angeboten werden
10. der 15-Minuten-Cache funktioniert
11. LocalStorage nicht mehr primäre Geschäftsdatenquelle ist
12. Doku und Testgrundlage aktualisiert sind

## Aufgaben des Nutzers außerhalb der IDE

Vor der finalen Produktivabnahme muss der Nutzer:

- Cloudflare-Deployment im Dashboard prüfen
- Supabase-Tabellen und Seeds im Dashboard prüfen
- produktiven Link öffnen und Passwortfluss manuell testen
- mindestens einen zweiten Browser oder ein zweites Gerät für Response-Persistenz testen
- finalen Link und Team-Passwort ans Team verteilen

## Hinweise für den Agent
- Keine großen kosmetischen Refactorings vor Abschluss der Kernarchitektur
- Erst Produktionsfähigkeit, dann Schönheitsreparaturen
- Bestehende Domain-Logik respektieren, wenn sie fachlich bereits passt

## Free-Plan-Einschätzung
Auch nach Tests und Fertigstellung bleibt die Lösung für euren Umfang voraussichtlich im Gratisbetrieb:
- Cloudflare Pages Free
- Cloudflare Workers Free
- Supabase Free
- keine zusätzlichen Paid-Dienste eingeplant
