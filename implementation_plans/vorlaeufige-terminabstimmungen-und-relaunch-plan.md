# Vorläufige Terminabstimmungen und Relaunch Plan

Ziel: Das neue Modell soll vorläufige Terminabstimmungen für ein Match sauber unterstützen, inklusive mehrerer Terminvorschläge auf einmal, gruppierter Darstellung im Dashboard und einem klaren Relaunch-Vorgehen ohne lange sichtbare Migrationsphase.

## Fachliche Leitlinie

- [ ] Ein `match` bleibt die stabile Spielidentität.
- [ ] Ein `match_appointment` ist ein konkreter oder möglicher Termin zu einem Match.
- [ ] Ein `availability_poll` bleibt an genau einen Appointment gebunden.
- [ ] Eine Terminabstimmung mit mehreren Vorschlägen wird technisch als mehrere `planned` Appointments + mehrere Polls unter demselben Match modelliert.
- [ ] Im UI werden diese Polls als eine gruppierte Terminabstimmung dargestellt.
- [ ] Pro Match gibt es fachlich maximal ein aktuelles `scheduled` Appointment.
- [ ] `planned` Appointments erscheinen nicht im Kalender.
- [ ] `scheduled` Appointments erscheinen im Kalender.
- [ ] `cancelled` Appointments bleiben fachlich erhalten, auch wenn sie im Kalender-MVP noch nicht exportiert werden.

## Teil A: Vorläufige Terminabstimmungen

### Paket A1: API-Request für mehrere Vorschläge

- [x] `POST /api/polls` für `type = date-finding` um `suggestions[]` erweitern.
- [x] Request-Form validieren:
  - [x] mindestens ein Vorschlag
  - [x] Datum erforderlich
  - [x] Uhrzeit optional
  - [x] Duplikate in derselben Anfrage verhindern
- [x] Für `type = match` beim bisherigen Einzeltermin-Flow bleiben.
- [x] Für `type = date-finding` statt eines Appointments mehrere `planned` Appointments erzeugen.
- [x] Für jeden Vorschlag genau eine Poll erzeugen.
- [x] Für jede Poll initiale Responses der aktiven Spieler erzeugen.
- [x] Response-Shape für das Frontend weiter kompatibel halten.

Vorgesehener Request für Terminabstimmung:

```json
{
  "title": "Loud'n'Proud Terminfindung",
  "type": "date-finding",
  "opponent": "Loud'n'Proud",
  "homeAway": "home",
  "suggestions": [
    { "date": "2026-05-01", "time": "20:00", "location": "Lowhofer" },
    { "date": "2026-05-05", "time": "19:30", "location": "Lowhofer" },
    { "date": "2026-05-08", "time": "20:15", "location": "Lowhofer" }
  ]
}
```

### Paket A2: Dashboard-Gruppierung

- [x] Dashboard-Daten nicht mehr nur als flache Poll-Liste betrachten.
- [x] Client-seitig nach `matchId` gruppieren.
- [x] Für Gruppen mit genau einem Termin weiter die bestehende Card-Logik verwenden.
- [x] Für Gruppen mit mehreren `planned` Terminen eine gruppierte Card darstellen.
- [x] In der gruppierten Card je Vorschlag Datum/Uhrzeit/Ort anzeigen.
- [ ] In der gruppierten Card pro Vorschlag die aktuelle Zusagezahl anzeigen, wenn vorhanden.
- [ ] Geöffnete und geschlossene Vorschläge visuell unterscheidbar machen.

Vorgesehene Gruppierungslogik:

```text
scheduled Match mit 1 Poll
-> normale Dashboard-Card

date-finding Match mit mehreren planned Polls
-> eine Dashboard-Card mit mehreren Vorschlagszeilen
```

### Paket A3: Poll-/Terminentscheidung

- [x] Admin-Flow ergänzen, um aus mehreren `planned` Vorschlägen einen Gewinner zu bestimmen.
- [x] Gewähltes Appointment auf `scheduled` setzen.
- [x] Nicht gewählte `planned` Appointments löschen oder verwerfen.
- [x] Zugehörige Polls nicht still in inkonsistentem Zustand lassen.
- [x] Nach Finalisierung Dashboard und Kalender aktualisieren.

Entscheidung:

- [x] Nicht gewählte Vorschläge werden hart gelöscht.
- [ ] Oder sollen zugehörige Polls archiviert und im UI ausgeblendet werden?

Umsetzung:

- [x] Nicht gewählte `planned` Appointments löschen.
- [x] Zugehörige Polls ebenfalls löschen oder sicher archivieren.

### Paket A4: UI beim Anlegen

- [x] New-Poll-Form für `Terminabstimmung` um mehrere Vorschlagszeilen erweitern.
- [x] Standardmäßig einen leeren Vorschlag anzeigen.
- [x] `+ Terminvorschlag` Button hinzufügen.
- [x] Vorschläge einzeln entfernbar machen.
- [x] Match-Flow und Terminabstimmungs-Flow im Formular klar trennen.
- [x] Bei `type = match` nur einen festen Termin erlauben.
- [x] Bei `type = date-finding` `suggestions[]` senden.

Vorgesehene UI:

```text
Typ = Match
-> genau ein Termin

Typ = Terminabstimmung
-> mehrere Terminvorschläge
-> Button: + Terminvorschlag
```

### Paket A5: Tests für Terminabstimmungen

- [ ] Unit-Tests für Request-Normalisierung von `suggestions[]`
- [x] Tests für Gruppierungslogik im Dashboard
- [ ] Tests für Finalisierung eines geplanten Termins
- [ ] Tests für den Create-Flow mit mehreren `planned` Appointments
- [ ] Tests für Duplikatvermeidung innerhalb derselben Anfrage

## Teil B: Relaunch-Vorgehen

Ziel: Keine lange sichtbare Migrationsphase. Stattdessen gezielte Übernahme weniger relevanter Alt-Daten und Go-Live auf neuem Modell.

### Paket B1: Relaunch-Entscheidung

- [ ] Entscheidung treffen: Relaunch auf bestehender DB oder frischer DB.
- [ ] Empfohlene Richtung prüfen: frische DB + selektiver Import.

Empfehlung:

- [ ] Frische Ziel-DB oder frischer lokaler Reset als Basis.
- [ ] Kein historischer Vollimport der kompletten alten Poll-Welt.
- [ ] Nur fachlich relevante Alt-Daten übernehmen.

### Paket B2: Übernahmematrix

#### 1:1 übernehmen

- [ ] `players`
- [ ] `player_positions`
- [ ] `team_settings.team_password_hash`
- [ ] `team_settings.team_name`
- [ ] `team_settings.team_slogan`
- [ ] `team_settings.minimum_yes_players`
- [ ] `team_settings.mixed_minimum_women_on_field`
- [ ] `team_settings.libero_counts_as_full_woman`
- [ ] `team_settings.league_base_url`
- [ ] `team_settings.league_table_url`
- [ ] `team_settings.league_fixtures_url`

#### Optional übernehmen

- [ ] `player_update_state`
- [ ] `league_cache`
- [ ] genau 1-2 aktuelle relevante Polls
- [ ] zugehörige `availability_responses`

#### Nicht übernehmen

- [ ] alte historische Polls ohne aktuellen Nutzen
- [ ] alte Legacy-Terminlogik
- [ ] alte Cache-Stände, wenn unklar oder veraltet

### Paket B3: Importlogik für Relaunch

- [ ] Exportskript oder SQL für `players` definieren.
- [ ] Exportskript oder SQL für `player_positions` definieren.
- [ ] Exportskript oder SQL für `team_settings` definieren.
- [ ] Falls relevant: gezielten Export für 1-2 offene Polls definieren.
- [ ] Falls Polls übernommen werden: Alt-Polls in neues Modell transformieren.

Wenn Polls übernommen werden:

```text
Alt-Poll
-> Match
-> Appointment
-> Poll
-> Responses
```

### Paket B4: Lokaler Relaunch-Test

- [ ] Frische lokale DB vorbereiten.
- [ ] Nur neue Migrationen / neues Schema anwenden.
- [ ] Selektiven Import aus Altbestand ausführen.
- [ ] Login mit übernommenen Spielern testen.
- [ ] Team-Passwort prüfen.
- [ ] Liga-URLs prüfen.
- [ ] Optional übernommene Polls prüfen.
- [ ] Dashboard prüfen.
- [ ] Kalenderfeed prüfen.

### Paket B5: Go-Live für Relaunch

- [ ] Wartungsfenster festlegen.
- [ ] Finalen kleinen Datenexport aus Altbestand ziehen.
- [ ] Neue Ziel-DB befüllen.
- [ ] Neue App deployen.
- [ ] Smoke-Test direkt nach Deploy:
  - [ ] Login
  - [ ] Dashboard
  - [ ] bestehende Spieler sichtbar
  - [ ] neue Poll anlegen
  - [ ] Kalenderfeed abrufen
- [ ] Alte App deaktivieren.

### Paket B6: Rollback-Strategie

- [ ] Alt-App bis zur finalen Freigabe nicht löschen.
- [ ] Produktive Alt-DB vor Go-Live sichern.
- [ ] Wenn Go-Live fehlschlägt: alte App wieder aktivieren.
- [ ] Wenn neue DB fehlerhaft ist: auf alten Stand zurückschalten statt halbfertig reparieren.

## Kalenderbezug im neuen Modell

- [ ] Kalender liest weiterhin ausschließlich `match_appointments`.
- [x] `scheduled` Termine gehen in den Feed.
- [x] `planned` Vorschläge bleiben aus dem Feed heraus.
- [x] Teilnehmerliste aller Zusagen im Kalenderinhalt ergänzen.
- [x] Kalenderinhalt wird aus Appointment + Match + Response-Zusagen aufgebaut.
- [ ] Bei Relaunch muss der Kalenderfeed direkt mit der neuen Datenbasis funktionieren.

## Akzeptanzkriterien

- [x] Eine Terminabstimmung kann mehrere Vorschläge in einem Vorgang anlegen.
- [x] Jeder Vorschlag erzeugt ein `planned` Appointment mit eigener Poll.
- [x] Das Dashboard zeigt mehrere Vorschläge gruppiert unter einem Match.
- [ ] Ein Vorschlag kann zum finalen `scheduled` Termin gemacht werden.
- [ ] Nicht gewählte Vorschläge verschwinden konsistent.
- [x] Der Kalenderfeed zeigt nur `scheduled` Termine.
- [ ] Relaunch kann mit selektiver Datenübernahme durchgeführt werden.
- [ ] Spieler, Passwort und Liga-Settings bleiben beim Relaunch erhalten.
