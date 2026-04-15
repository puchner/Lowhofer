# Let the Ox Fetz – Schritte, die du selbst erledigen musst

Diese Liste enthält bewusst nur Dinge, die typischerweise **nicht** sinnvoll komplett von deinem Coding-Agent in der IDE erledigt werden können oder sollten.

## A. Konten und Projekte anlegen

### 1. Cloudflare-Konto anlegen
- Cloudflare-Konto erstellen oder vorhandenes Konto verwenden.
- Im Dashboard **Workers & Pages** öffnen.

### 2. Cloudflare Pages Projekt anlegen
- Neues **Pages**-Projekt erstellen.
- GitHub mit Cloudflare verbinden.
- Das passende Repository auswählen.
- Build-Settings setzen:
  - Build command: `npm run build`
  - Output directory: `dist`

Wichtig:
- Das Projekt muss vorher in einem GitHub-Repository liegen.
- Wenn kein GitHub CLI (`gh`) oder keine GitHub-Authentifizierung lokal vorhanden ist, muss das Repository manuell über GitHub Desktop, IntelliJ oder die GitHub-Weboberfläche angelegt und gepusht werden.

### 3. Supabase-Konto und Projekt anlegen
- Supabase-Konto erstellen oder vorhandenes Konto verwenden.
- Neues Projekt anlegen.
- Datenbank-Passwort sicher speichern.
- Diese Werte notieren:
  - Project URL
  - service role key

## B. Secrets / Umgebungsvariablen setzen

### 4. Secrets in Cloudflare anlegen
Diese Werte musst du im Cloudflare-Projekt als Secret / Environment Variable hinterlegen:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`

Wichtig:
- `SUPABASE_SERVICE_ROLE_KEY` nur serverseitig verwenden.
- `SESSION_SECRET` muss ein ausreichend langer zufälliger Wert sein.
- Nichts davon im Git-Repo committen.

### 5. Keine Frontend-Supabase-Secrets setzen
Für den MVP spricht das Frontend für Geschäftsdaten nur mit `/api/*`.

Deshalb brauchst du keine `VITE_SUPABASE_*`-Variablen für Polls, Responses oder Spieler.
Die Supabase-Verbindung bleibt serverseitig in den Cloudflare Pages Functions.

## C. Datenbank initial einrichten

### 6. Migrationen / SQL in Supabase ausführen
Das SQL liegt jetzt im Repo unter `supabase/`.

Wenn kein Supabase-CLI-Workflow verbunden ist, führe die Dateien im Supabase SQL Editor in dieser Reihenfolge aus:

1. `supabase/migrations/202604150001_create_core_schema.sql`
2. `supabase/seeds/001_initial_lowhofer_data.sql`

Geplante Tabellen:
- `players`
- `player_positions`
- `availability_polls`
- `availability_responses`
- `team_settings`
- `league_cache`

### 7. Initiale Daten anlegen
Du musst entscheiden oder einpflegen:
- Teamname / Slogan
- Team-Passwort
- Spielerliste
- welcher Spieler Admin ist

Die initialen Mock-Daten sind als Seed vorbereitet. Pia und Volker sind im Seed als Admins gesetzt.
Das Team-Passwort soll nicht als Klartext gespeichert werden, sondern als Hash in `team_settings.team_password_hash`.
Der Seed enthält dafür bewusst noch den Platzhalter `REPLACE_WITH_PBKDF2_HASH_FROM_PACKAGE_3`.

Hash erzeugen:

```bash
npm run hash:password -- "DEIN_TEAM_PASSWORT"
```

Der erzeugte Hash beginnt danach mit `pbkdf2-sha256$100000$`. Hohe Iterationswerte wie `210000` sind in Cloudflare Pages Functions hier nicht lauffaehig.

Danach im Seed den Platzhalter ersetzen oder nach dem Seed in Supabase aktualisieren:

```sql
update public.team_settings
set team_password_hash = 'DEIN_GENERIERTER_HASH';
```

## D. GitHub / Deployment

### 8. Repository pflegen
Falls noch nicht geschehen:
- lokales Git-Repository initialisieren
- ersten Commit erstellen
- GitHub-Repository anlegen
- Repo sauber in GitHub pushen
- Branch-Struktur festlegen
- ggf. `.env` sauber aus `.gitignore` ausschließen

### 9. Ersten Deploy auslösen
- Cloudflare Pages Deployment starten
- prüfen, ob Build erfolgreich ist
- prüfen, ob Functions korrekt deployt werden
- `/api/health` aufrufen und prüfen, ob die erwarteten Secrets als konfiguriert angezeigt werden

## E. Domain / Zugriff

### 10. Optional: Eigene Domain registrieren oder verbinden
Nur wenn du statt einer Cloudflare-Subdomain eine eigene Domain möchtest.
Dann musst du:
- Domain registrieren oder bestehende Domain verbinden
- DNS korrekt konfigurieren

Für einen ersten Teamtest ist das **nicht nötig**.

## F. Produktive Konfigurationen / Freigaben

### 11. Team-Passwort an dein Team kommunizieren
Da ihr bewusst mit einem gemeinsamen Team-Passwort arbeitet, musst du dieses einmal an die Mannschaft weitergeben.

### 12. Fixen Link im Chat anpinnen
- finalen Link posten
- ggf. Admin-Link zusätzlich separat für dich merken

## G. Abnahme / manuelle Tests

### 13. Produktiv testen
Diese Dinge solltest du selbst einmal bewusst durchklicken:
- Passwort-Gate
- Spielerwahl
- eigene Zu-/Absage
- Response-Persistenz in einem zweiten Browser oder auf einem zweiten Gerät
- Admin: Termin anlegen
- Admin: Termin löschen / archivieren
- Tabellen-Tab
- Liga-Termine beim Anlegen laden
- Verhalten bei Reload / neuem Browser

### 14. Fallback bei Verbandsdaten prüfen
- prüfen, ob der Cache funktioniert
- prüfen, was bei Fehlern oder Nichterreichbarkeit angezeigt wird

## H. Laufender Betrieb

### 15. Spielerpflege
Wenn jemand neu ins Team kommt oder aufhört:
- Spieler anlegen / deaktivieren
- ggf. Positionen anpassen
- ggf. Admin-Rechte ändern

### 16. Beobachten der Nutzung
Gelegentlich prüfen:
- Cloudflare Deployments
- Logs der Functions
- Supabase Tabellendaten
- ob Verbandsdaten-Import stabil läuft

---

# Was dein Agent in der IDE gut vorbereiten kann
Das meiste Technische kann dein Agent erledigen, zum Beispiel:
- Cloudflare-Projektstruktur im Repo vorbereiten
- Wrangler-Scripts und `wrangler.toml` anlegen
- SQL-Migrationen schreiben
- API-Endpunkte bauen
- Session-Flow implementieren
- Frontend von LocalStorage auf API umbauen
- Cache-Logik für Verbandsdaten schreiben
- Seed-Scripts vorbereiten
- Deploy-Konfiguration im Repo anlegen

# Was du selbst entscheiden oder anklicken musst
Kurz zusammengefasst:
- GitHub-Repository anlegen oder lokalen GitHub-Login bereitstellen
- Cloudflare-Projekt anlegen
- Cloudflare mit GitHub verbinden
- Supabase-Projekt anlegen
- Secrets hinterlegen
- optional Domain verbinden
- `SESSION_SECRET` erzeugen
- Team-Passwort festlegen
- Spielerliste / Admin festlegen
- Migrationen oder Seed-Scripts im Supabase-Projekt ausführen
- Deploy freigeben und prüfen
- finalen Link ans Team verteilen
