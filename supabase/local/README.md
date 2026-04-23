# Local clone dumps

Ohne weitere Datei erzeugt `npm run local:setup` hier automatisch `generated_test_data.sql` mit synthetischen lokalen Testdaten.

Optional kannst du hier stattdessen einen produktionsnahen Daten-Dump als `prod_clone.sql` ablegen.

Der Workflow ist auf einen `data-only` SQL-Dump fuer das Schema `public` ausgelegt:

- `npm run local:setup` oder `npm run local:reset` setzt zuerst die lokale Datenbank zurueck.
- Danach wird `supabase/relaunch_schema.sql` eingespielt.
- Danach importiert der Befehl entweder `generated_test_data.sql` oder `prod_clone.sql`.

Beide Dateien sind bewusst git-ignoriert.
