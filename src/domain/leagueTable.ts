import { LOWHOFER_TEAM_NAME } from "../data/leagueSnapshot";
import { LeagueStanding, MatchOutcomeScenario } from "./leagueTypes";
import { MatchDay } from "./types";

const LOWHOFER_OUTCOMES = [
  { label: "2:0", lowhoferSets: 2, opponentSets: 0 },
  { label: "2:1", lowhoferSets: 2, opponentSets: 1 },
  { label: "1:2", lowhoferSets: 1, opponentSets: 2 },
  { label: "0:2", lowhoferSets: 0, opponentSets: 2 },
];

export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  return [...standings].sort(compareStandings);
}

export function buildLowhoferOutcomeScenarios(
  standings: LeagueStanding[],
  matchDay: MatchDay,
): MatchOutcomeScenario[] {
  const opponentName = matchDay.opponent;

  if (!standings.some((standing) => standing.team === opponentName)) {
    return [];
  }

  const currentLowhoferRank = getTeamRank(sortStandings(standings), LOWHOFER_TEAM_NAME);

  return LOWHOFER_OUTCOMES.map((outcome) => {
    const projectedStandings = applyLowhoferOutcome(standings, opponentName, outcome);
    const lowhoferStanding = projectedStandings.find((standing) => standing.team === LOWHOFER_TEAM_NAME);
    const lowhoferRank = getTeamRank(projectedStandings, LOWHOFER_TEAM_NAME);

    return {
      ...outcome,
      lowhoferRank,
      rankTrend: getRankTrend(currentLowhoferRank, lowhoferRank),
      lowhoferPoints: lowhoferStanding?.points ?? 0,
    };
  });
}

function applyLowhoferOutcome(
  standings: LeagueStanding[],
  opponentName: string,
  outcome: { lowhoferSets: number; opponentSets: number },
): LeagueStanding[] {
  return sortStandings(
    standings.map((standing) => {
      if (standing.team === LOWHOFER_TEAM_NAME) {
        return applyResult(standing, outcome.lowhoferSets, outcome.opponentSets);
      }

      if (standing.team === opponentName) {
        return applyResult(standing, outcome.opponentSets, outcome.lowhoferSets);
      }

      return standing;
    }),
  );
}

function applyResult(standing: LeagueStanding, setsWon: number, setsLost: number): LeagueStanding {
  return {
    ...standing,
    points: standing.points + setsWon,
    wins: standing.wins + (setsWon === 2 ? 1 : 0),
    setsWon: standing.setsWon + setsWon,
    setsLost: standing.setsLost + setsLost,
    games: standing.games + 1,
  };
}

function getTeamRank(standings: LeagueStanding[], teamName: string): number {
  return standings.findIndex((standing) => standing.team === teamName) + 1;
}

function getRankTrend(currentRank: number, projectedRank: number): MatchOutcomeScenario["rankTrend"] {
  if (projectedRank < currentRank) {
    return "up";
  }

  if (projectedRank > currentRank) {
    return "down";
  }

  return "same";
}

function compareStandings(a: LeagueStanding, b: LeagueStanding): number {
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    setRatio(b) - setRatio(a) ||
    ballRatio(b) - ballRatio(a) ||
    a.team.localeCompare(b.team)
  );
}

function setRatio(standing: LeagueStanding): number {
  return standing.setsLost === 0 ? Number.POSITIVE_INFINITY : standing.setsWon / standing.setsLost;
}

function ballRatio(standing: LeagueStanding): number {
  return standing.ballsLost === 0 ? Number.POSITIVE_INFINITY : standing.ballsWon / standing.ballsLost;
}
