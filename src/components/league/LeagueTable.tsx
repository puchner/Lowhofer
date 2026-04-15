import { LOWHOFER_TEAM_NAME } from "../../data/leagueSnapshot";
import { sortStandings } from "../../domain/leagueTable";
import { LeagueStanding } from "../../domain/leagueTypes";

interface LeagueTableProps {
  standings: LeagueStanding[];
  fetchedAt: string;
  isStale: boolean;
}

export function LeagueTable({ fetchedAt, isStale, standings }: LeagueTableProps) {
  const sortedStandings = sortStandings(standings);
  const fetchedDate = new Date(fetchedAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <section className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary sm:text-sm">Liga</p>
          <h3 className="text-xl font-bold text-petrol-900 sm:text-2xl">Tabelle</h3>
        </div>
        <p className="text-sm text-base-content/60">
          Quelle: volleyball-freizeit.de, Stand {fetchedDate}
          {isStale && " · Verbandsdaten aktuell nicht erreichbar"}
        </p>
      </div>

      <div className="mt-4 space-y-2 sm:hidden">
        {sortedStandings.map((standing, index) => {
          const isLowhofer = standing.team === LOWHOFER_TEAM_NAME;

          return (
            <article
              className={`rounded-lg border p-3 ${
                isLowhofer ? "border-secondary bg-secondary text-petrol-900" : "border-base-300 bg-base-100"
              }`}
              key={standing.team}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase opacity-70">Platz {index + 1}</p>
                  <p className="truncate text-base font-black">{standing.team}</p>
                </div>
                <p className="shrink-0 text-2xl font-black">{standing.points}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold">
                <span>Siege {standing.wins}</span>
                <span>
                  Sätze {standing.setsWon}:{standing.setsLost}
                </span>
                <span>Spiele {standing.games}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Platz</th>
              <th>Team</th>
              <th className="text-right">Punkte</th>
              <th className="text-right">Siege</th>
              <th className="text-right">Sätze</th>
              <th className="text-right">Bälle</th>
              <th className="text-right">Spiele</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((standing, index) => {
              const isLowhofer = standing.team === LOWHOFER_TEAM_NAME;

              return (
                <tr className={isLowhofer ? "bg-secondary text-petrol-900" : undefined} key={standing.team}>
                  <td className="font-bold">{index + 1}</td>
                  <td className={isLowhofer ? "font-black" : "font-semibold"}>{standing.team}</td>
                  <td className="text-right font-bold">{standing.points}</td>
                  <td className="text-right">{standing.wins}</td>
                  <td className="text-right">
                    {standing.setsWon}:{standing.setsLost}
                  </td>
                  <td className="text-right">
                    {standing.ballsWon}:{standing.ballsLost}
                  </td>
                  <td className="text-right">{standing.games}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
