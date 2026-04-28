import { FormEvent, useEffect, useState } from "react";
import { fetchLeagueSource, fetchLeagueTable, LeagueTableResult, updateLeagueSource } from "../api/plannerApi";
import { LeagueTable } from "../components/league/LeagueTable";
import { canManageLeagueSource } from "../domain/permissions";
import { useCurrentUserCapabilities } from "../session/sessionStore";

export function LeagueTablePage() {
  const currentUser = useCurrentUserCapabilities();
  const [tableData, setTableData] = useState<LeagueTableResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadTable() {
    setIsLoading(true);
    fetchLeagueTable()
      .then(setTableData)
      .catch(() => setError("Tabelle konnte nicht geladen werden."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadTable();
  }, []);

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary sm:text-sm">Liga</p>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Tabelle</h2>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60">
          Tabelle wird geladen…
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div>
      )}

      {!isLoading && tableData && (
        <LeagueTable fetchedAt={tableData.fetchedAt} isStale={tableData.isStale} standings={tableData.standings} />
      )}

      {canManageLeagueSource(currentUser) && <LeagueSourceAdmin onSaved={loadTable} />}
    </section>
  );
}

function LeagueSourceAdmin({ onSaved }: { onSaved: () => void }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchLeagueSource()
      .then((settings) => setBaseUrl(settings.leagueBaseUrl ?? ""))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateLeagueSource(baseUrl.trim());
      setSaveSuccess(true);
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-warning/40 bg-warning/5 p-3 sm:p-4">
      <p className="text-xs font-semibold uppercase text-warning">Admin</p>
      <h3 className="mt-1 text-base font-bold text-petrol-900">Liga-Quelle ändern</h3>
      <p className="mt-1 text-sm text-base-content/60">
        Basis-URL der Liga-Seite eingeben (z.&nbsp;B.{" "}
        <code className="rounded bg-base-200 px-1 text-xs">https://www.volleyball-freizeit.de/saison/1083</code>
        ). Die XML-Abruf-URLs werden automatisch abgeleitet.
      </p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <input
          className="input input-bordered min-h-11 w-full rounded-lg text-sm"
          disabled={isSaving}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://www.volleyball-freizeit.de/saison/…"
          required
          type="url"
          value={baseUrl}
        />
        <button
          className="btn btn-warning min-h-11 shrink-0 rounded-lg text-sm font-bold text-petrol-900"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Wird gespeichert…" : "Speichern"}
        </button>
      </form>
      {saveError && <p className="mt-2 text-sm text-error">{saveError}</p>}
      {saveSuccess && (
        <p className="mt-2 text-sm font-semibold text-success">Gespeichert. Cache wurde geleert.</p>
      )}
    </section>
  );
}
