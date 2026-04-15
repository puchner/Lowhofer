# Paket 1 – Cloudflare-Umstellung

## Ziel
Das Projekt technisch so vorbereiten, dass es auf Cloudflare Pages + Pages Functions sauber entwickelt und deployed werden kann.

## Hintergrund
Das bestehende Projekt ist noch teilweise Firebase-orientiert:
- Firebase Hosting vorbereitet
- Firebase Deploy-Skripte vorhanden
- Cloudflare-spezifische Struktur fehlt

Diese Umstellung ist ein eigenes Paket und soll **früh** erfolgen.

## Nicht-Ziel
In diesem Paket werden noch keine fertigen Fachfeatures implementiert.  
Es geht um Laufzeitumgebung, Projektstruktur und Build-/Deploy-Basis.

## Aufgaben

### 1. Tooling für Cloudflare einführen
- `wrangler` als Dev-Dependency ergänzen
- passende Scripts in `package.json` ergänzen, z. B. für:
  - lokale Worker-/Pages-Entwicklung
  - Build
  - Preview/Deploy-Vorbereitung

### 2. Zielstruktur für Servercode festlegen
- `functions/` als Cloudflare-Pages-Functions-Struktur einführen
- `/api/*` über Pages Functions neben dem Vite-Frontend bereitstellen
- API-Endpunkte logisch gruppieren:
  - `session`
  - `players`
  - `polls`
  - `league`

### 3. Konfigurationsschicht einführen
Trennung zwischen:
- Frontend-Konfiguration
- serverseitiger Konfiguration
- Geheimnissen / Secrets

Wichtig:
- `SUPABASE_SERVICE_ROLE_KEY` ausschließlich serverseitig
- `SESSION_SECRET` ausschließlich serverseitig
- kein direkter Frontend-Supabase-Client für Geschäftsdaten im MVP

### 4. Firebase-Altlasten markieren
- bestehende Firebase-Dateien und Scripts im Repo identifizieren
- dokumentieren, ob sie:
  - entfernt,
  - ignoriert,
  - oder vorübergehend als Altlast belassen werden

### 5. README / Setup-Doku aktualisieren
- Firebase nicht mehr als Zielplattform darstellen
- Cloudflare-Entwicklungs- und Deployweg dokumentieren

## Deliverables
- Cloudflare-kompatible Projektstruktur: erledigt mit `functions/`
- `wrangler` eingebunden: erledigt
- passende `package.json`-Scripts: erledigt
- Firebase-Altlasten klar markiert bzw. entfernt: erledigt
- Doku aktualisiert: erledigt

## Aufgaben des Nutzers außerhalb der IDE

Der Agent kann diese Punkte dokumentieren und vorbereiten, aber nicht selbst abschließen:

- Cloudflare-Konto öffnen oder anlegen
- Cloudflare-Pages-Projekt anlegen
- GitHub-Repository mit Cloudflare Pages verbinden
- falls lokal kein GitHub CLI bzw. keine GitHub-Authentifizierung vorhanden ist: GitHub-Repository manuell anlegen und pushen
- Build-Einstellungen im Cloudflare-Dashboard prüfen:
  - Build command: `npm run build`
  - Output directory: `dist`
- Cloudflare-Secrets/Environment Variables im Dashboard hinterlegen
- ersten produktiven Deploy in Cloudflare freigeben und Dashboard-Logs prüfen

## Aktueller Umsetzungsstand

Paket 1 ist im Repo umgesetzt.

- `wrangler` und Cloudflare-Worker-Typen sind installiert
- `wrangler.toml` ist vorhanden
- `functions/api/health.ts` stellt einen ersten Pages-Functions-Endpunkt bereit
- `functions/_shared/env.ts` kapselt serverseitige Secret-Pruefung
- Firebase-Deploy-Skripte und Firebase-Konfiguration wurden entfernt
- README und Setup-Dokumentation wurden auf Cloudflare Pages aktualisiert

## Hinweise für den Agent
- Keine bezahlten Cloudflare-Produkte einplanen
- Keine Bindings wie KV, D1 oder Durable Objects voraussetzen
- Für den MVP reicht:
  - Pages
  - Pages Functions
  - Secrets
  - externer DB-Zugriff auf Supabase

## Free-Plan-Einschätzung
Dieses Paket bleibt innerhalb kostenlos nutzbarer Komponenten:
- Pages Free
- Workers Free
- lokales Wrangler-Tooling
