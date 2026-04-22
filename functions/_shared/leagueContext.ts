import { CloudflareEnv } from "./env";
import { getTeamLeagueSettings } from "./supabase";

export const DEFAULT_TEAM_KEY = "lowhofer";
export const DEFAULT_SEASON_KEY = "unknown";

export interface LeagueContext {
  seasonKey: string;
  teamKey: string;
}

export function extractSeasonKey(baseUrl: string | null | undefined): string {
  return baseUrl?.match(/\/saison\/(\d+)/)?.[1] ?? DEFAULT_SEASON_KEY;
}

export async function getLeagueContext(env: CloudflareEnv): Promise<LeagueContext> {
  const settings = await getTeamLeagueSettings(env);

  return {
    seasonKey: extractSeasonKey(settings?.league_base_url),
    teamKey: DEFAULT_TEAM_KEY,
  };
}
