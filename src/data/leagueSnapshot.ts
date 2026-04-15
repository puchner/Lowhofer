import generatedLeagueSnapshot from "./leagueSnapshot.generated.json";
import { LeagueStanding } from "../domain/leagueTypes";

interface LeagueSnapshotData {
  sourceUrl: string;
  lastChange: string;
  standings: LeagueStanding[];
}

const leagueSnapshot = generatedLeagueSnapshot as LeagueSnapshotData;

export const LOWHOFER_TEAM_NAME = "Die lowhofer";
export const leagueStandingsSnapshot = leagueSnapshot.standings;
export const leagueSnapshotLastChange = leagueSnapshot.lastChange;
export const leagueSnapshotSourceUrl = leagueSnapshot.sourceUrl;
