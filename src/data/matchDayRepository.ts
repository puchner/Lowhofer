import { LeagueFixture, MatchDay, Player } from "../domain/types";
import { leagueFixtures } from "./leagueFixtures";
import { mockMatchDays } from "./mockMatchDays";
import { mockPlayers } from "./mockPlayers";

// TODO: Repository später durch Supabase-Queries ersetzen und API der UI stabil halten.
export function listPlayers(): Player[] {
  return mockPlayers;
}

export function listMatchDays(): MatchDay[] {
  return [...mockMatchDays].sort((a, b) => a.date.localeCompare(b.date));
}

export function listLeagueFixtures(): LeagueFixture[] {
  return [...leagueFixtures].sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"));
}

export function getMatchDayById(id: string): MatchDay | undefined {
  return mockMatchDays.find((matchDay) => matchDay.id === id);
}
