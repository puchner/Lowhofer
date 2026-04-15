import { Link } from "react-router-dom";
import { leagueStandingsSnapshot } from "../../data/leagueSnapshot";
import { analyzeMatchDay } from "../../domain/analyzeSquad";
import { MatchDay, Player } from "../../domain/types";
import { OutcomeProjection } from "../league/OutcomeProjection";
import { TrafficLight } from "../ui/TrafficLight";

interface MatchDayCardProps {
  matchDay: MatchDay;
  players: Player[];
  action?: React.ReactNode;
  detailPath?: string;
}

export function MatchDayCard({ detailPath, matchDay, players, action }: MatchDayCardProps) {
  const analysis = analyzeMatchDay(matchDay, players);
  const resolvedDetailPath = detailPath ?? `/match-days/${matchDay.id}`;

  return (
    <article className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm transition hover:border-secondary hover:shadow-md sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link
            className="block text-lg font-bold leading-snug text-petrol-900 underline-offset-4 hover:underline"
            to={resolvedDetailPath}
          >
            {formatDate(matchDay.date)} {matchDay.time ? `um ${matchDay.time}` : ""}
          </Link>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">{describePoll(matchDay)}</p>
          <div className="mt-2">
            <OutcomeProjection matchDay={matchDay} standings={leagueStandingsSnapshot} />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-primary">{analysis.availableCount} Zusagen</span>
            <TrafficLight status={analysis.status} />
          </div>
          {action ? <div className="w-full lg:w-80">{action}</div> : null}
        </div>
      </div>
    </article>
  );
}

function describePoll(matchDay: MatchDay): string {
  const locationLabel =
    matchDay.homeAway === "home" ? "Heimspiel" : matchDay.homeAway === "away" ? "Auswärts" : "Ort offen";

  if (matchDay.type === "date-finding") {
    return `Terminabstimmung · ${matchDay.opponent}`;
  }

  return `${locationLabel} gegen ${matchDay.opponent}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
