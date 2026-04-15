export interface LeagueStanding {
  team: string;
  points: number;
  wins: number;
  setsWon: number;
  setsLost: number;
  ballsWon: number;
  ballsLost: number;
  games: number;
}

export interface MatchOutcomeScenario {
  label: string;
  lowhoferSets: number;
  opponentSets: number;
  lowhoferRank: number;
  rankTrend: "up" | "same" | "down";
  lowhoferPoints: number;
}
