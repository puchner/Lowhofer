import { LeagueTable } from "../components/league/LeagueTable";
import { leagueSnapshotLastChange, leagueStandingsSnapshot } from "../data/leagueSnapshot";

export function LeagueTablePage() {
  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary sm:text-sm">Liga</p>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Tabelle</h2>
      </div>

      <LeagueTable sourceLastChange={leagueSnapshotLastChange} standings={leagueStandingsSnapshot} />
    </section>
  );
}
