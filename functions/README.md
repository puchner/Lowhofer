# Cloudflare Pages Functions

API-Endpunkte liegen unter `functions/api/*` und werden von Cloudflare Pages als `/api/*` bereitgestellt.

Geplante Gruppen:

- `session`
- `players`
- `polls`
- `league`

Serverseitige Secrets werden ausschließlich über die Cloudflare-Environment-Bindings gelesen:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`

Das Frontend nutzt für MVP-Geschäftsdaten keinen direkten Supabase-Client.
