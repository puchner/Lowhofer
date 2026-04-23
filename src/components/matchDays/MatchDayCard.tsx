import { analyzeMatchDay } from "../../domain/analyzeSquad";
import { LeagueStanding } from "../../domain/leagueTypes";
import { MatchDay, Player } from "../../domain/types";
import { OutcomeProjection } from "../league/OutcomeProjection";
import { MatchHostCard } from "../match/MatchHostCard";
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
    <MatchHostCard
      action={action}
      date={matchDay.date}
      headerAction={headerAction}
      homeAway={matchDay.homeAway}
      location={matchDay.location}
      meta={
        <>
          <span className="badge badge-primary badge-sm">{analysis.availableCount} Zusagen</span>
          <TrafficLight compact status={analysis.status} />
        </>
      }
      extra={standings ? <OutcomeProjection matchDay={matchDay} standings={standings} /> : undefined}
      opponent={matchDay.opponent}
      time={matchDay.time}
      titleLinkTo={resolvedDetailPath}
    />
  );
}
