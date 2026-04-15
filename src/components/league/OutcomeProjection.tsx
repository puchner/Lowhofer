import { MatchDay } from "../../domain/types";
import { buildLowhoferOutcomeScenarios } from "../../domain/leagueTable";
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

  return (
    <div className="flex flex-wrap gap-1.5">
      {scenarios.map((scenario) => {
        const trend = trendMeta[scenario.rankTrend];

        return (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${trend.className}`}
            key={scenario.label}
            title={`Lowhofer waere auf Platz ${scenario.lowhoferRank}`}
          >
            <span aria-hidden="true">{trend.icon}</span>
            {scenario.label}
          </span>
        );
      })}
    </div>
  );
}

const trendMeta = {
  up: {
    icon: "↑",
    className: "bg-success/15 text-success",
  },
  same: {
    icon: "-",
    className: "bg-warning/20 text-warning",
  },
  down: {
    icon: "↓",
    className: "bg-error/15 text-error",
  },
};
