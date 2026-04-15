import generatedLeagueFixtures from "./leagueFixtures.generated.json";
import { LeagueFixture } from "../domain/types";

export const leagueFixtures = generatedLeagueFixtures as LeagueFixture[];
