import { Minus, MoveDownRight, MoveUpRight } from "lucide-react";
import { MatchDay } from "../../domain/types";
import { buildLowhoferOutcomeScenarios, getLowhoferRank } from "../../domain/leagueTable";
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
            <RankChangeIcon change={rankChange} />
          </span>
        );
      })}
    </div>
  );
}

function RankChangeIcon({ change }: { change: number }) {
  if (change > 0) {
    return <MoveUpRight aria-label="Tabellenplatz steigt" className="h-3.5 w-3.5" strokeWidth={2.4} />;
  }

  if (change === 0) {
    return <Minus aria-label="Tabellenplatz bleibt gleich" className="h-3.5 w-3.5" strokeWidth={2.4} />;
  }

  return <MoveDownRight aria-label="Tabellenplatz faellt" className="h-3.5 w-3.5" strokeWidth={2.4} />;
}

function getChangeClass(change: number): string {
  if (change > 0) {
    return "bg-success/15 text-success";
  }

  if (change < 0) {
    return "bg-error/15 text-error";
  }

  return "bg-slate-100 text-slate-700";
}

function getCurrentLowhoferRank(standings: LeagueStanding[]): number {
  return getLowhoferRank(standings);
}
