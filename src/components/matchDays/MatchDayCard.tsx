import { BusFront, CircleHelp, House } from "lucide-react";
import { Link } from "react-router-dom";
import { analyzeMatchDay } from "../../domain/analyzeSquad";
import { LeagueStanding } from "../../domain/leagueTypes";
import { MatchDay, Player } from "../../domain/types";
import { OutcomeProjection } from "../league/OutcomeProjection";
import { TrafficLight } from "../ui/TrafficLight";

interface MatchDayCardProps {
  matchDay: MatchDay;
  players: Player[];
  action?: React.ReactNode;
  headerAction?: React.ReactNode;
  detailPath?: string;
  standings?: LeagueStanding[];
}

export function MatchDayCard({ detailPath, matchDay, players, action, headerAction, standings }: MatchDayCardProps) {
  const analysis = analyzeMatchDay(matchDay, players);
  const resolvedDetailPath = detailPath ?? `/match-days/${matchDay.id}`;

  return (
    <article className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm transition hover:border-secondary hover:shadow-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <HomeAwayIcon homeAway={matchDay.homeAway} />
              <Link
                className="min-w-0 text-base font-bold leading-snug text-petrol-900 underline-offset-4 hover:underline sm:text-lg"
                to={resolvedDetailPath}
              >
                {formatDate(matchDay.date)} {matchDay.time ? `um ${matchDay.time}` : ""}
              </Link>
            </div>
            {headerAction ? <div className="flex shrink-0 items-center gap-1.5">{headerAction}</div> : null}
          </div>
          <p className="mt-1 truncate text-sm text-base-content/70">{describePoll(matchDay)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="badge badge-primary badge-sm">{analysis.availableCount} Zusagen</span>
            <TrafficLight compact status={analysis.status} />
          </div>
          {standings ? (
            <div className="mt-1.5">
              <OutcomeProjection matchDay={matchDay} standings={standings} />
            </div>
          ) : null}
        </div>
        {action ? <div className="w-full lg:max-w-72 lg:shrink-0">{action}</div> : null}
      </div>
    </article>
  );
}

function describePoll(matchDay: MatchDay): string {
  if (matchDay.type === "date-finding") {
    return matchDay.opponent;
  }

  return matchDay.opponent;
}

function HomeAwayIcon({ homeAway }: { homeAway: MatchDay["homeAway"] }) {
  const iconClassName = "h-4 w-4";

  if (homeAway === "home") {
    return <House aria-label="Heimspiel" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  if (homeAway === "away") {
    return <BusFront aria-label="Auswärts" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  return <CircleHelp aria-label="Ort offen" className={`${iconClassName} text-base-content/50`} strokeWidth={2.2} />;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
