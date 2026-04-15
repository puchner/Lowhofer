import { LOWHOFER_TEAM_NAME } from "../../data/leagueSnapshot";
import { MatchDay } from "../../domain/types";
import { buildLowhoferOutcomeScenarios, sortStandings } from "../../domain/leagueTable";
import { LeagueStanding } from "../../domain/leagueTypes";

interface OutcomeProjectionProps {
  matchDay: MatchDay;
  standings: LeagueStanding[];
}

export function OutcomeProjection({ matchDay, standings }: OutcomeProjectionProps) {
  const scenarios = buildLowhoferOutcomeScenarios(standings, matchDay);

  if (scenarios.length === 0) {
    return null;
  }

  const currentRank = getCurrentLowhoferRank(standings);

  if (!currentRank) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {scenarios.map((scenario) => {
        const rankChange = currentRank - scenario.lowhoferRank;

        return (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${getChangeClass(rankChange)}`}
            key={scenario.label}
            title={`Lowhofer waere auf Platz ${scenario.lowhoferRank}`}
          >
            <span>{scenario.label}</span>
            <span>{formatRankChange(rankChange)}</span>
          </span>
        );
      })}
    </div>
  );
}

function formatRankChange(change: number): string {
  if (change > 0) {
    return `+${change}`;
  }

  if (change === 0) {
    return "0";
  }

  return `${change}`;
}

function getChangeClass(change: number): string {
  if (change > 0) {
    return "bg-success/15 text-success";
  }

  if (change < 0) {
    return "bg-error/15 text-error";
  }

  return "bg-warning/20 text-warning";
}

function getCurrentLowhoferRank(standings: LeagueStanding[]): number {
  return sortStandings(standings).findIndex((standing) => standing.team === LOWHOFER_TEAM_NAME) + 1;
}
