import { requireAdmin, requireSelectedPlayer } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { deriveLeagueUrls, extractSeasonKeyFromLeagueBaseUrl, validateSeasonKey } from "../../_shared/leagueSource";
import { getTeamLeagueSettings, invalidateLeagueCache, updateTeamLeagueSource } from "../../_shared/supabase";

const FALLBACK_LEAGUE_BASE_URL = "https://www.volleyball-freizeit.de/saison/1083";
const FALLBACK_SEASON_KEY = "1083";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const settings = await getTeamLeagueSettings(env);
  const leagueBaseUrl =
    settings?.league_base_url ?? deriveLeagueBaseUrl(settings?.league_table_url) ?? FALLBACK_LEAGUE_BASE_URL;
  const seasonKey = extractSeasonKeyFromLeagueBaseUrl(leagueBaseUrl) ?? FALLBACK_SEASON_KEY;

  return jsonResponse({
    seasonKey,
    leagueBaseUrl,
    leagueTableUrl: settings?.league_table_url ?? null,
    leagueFixturesUrl: settings?.league_fixtures_url ?? null,
  });
};

export const onRequestPatch: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireAdmin(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<{ seasonKey?: string; leagueBaseUrl?: string }>(request);

  const seasonKey = body?.seasonKey?.trim() ?? extractSeasonKeyFromLeagueBaseUrl(body?.leagueBaseUrl)?.trim();

  if (!seasonKey) {
    return jsonResponse({ error: "seasonKey_required" }, { status: 400 });
  }

  if (!validateSeasonKey(seasonKey)) {
    return jsonResponse({ error: "invalid_season_key" }, { status: 400 });
  }

  const { baseUrl, tableUrl, fixturesUrl } = deriveLeagueUrls(seasonKey);

  try {
    await updateTeamLeagueSource(env, baseUrl, tableUrl, fixturesUrl);
    await invalidateLeagueCache(env);
  } catch {
    return jsonResponse({ error: "league_source_update_failed" }, { status: 503 });
  }

  return jsonResponse({
    seasonKey,
    leagueBaseUrl: baseUrl,
    leagueTableUrl: tableUrl,
    leagueFixturesUrl: fixturesUrl,
  });
};

function deriveLeagueBaseUrl(xmlUrl: string | null | undefined): string | null {
  if (!xmlUrl) {
    return null;
  }

  try {
    const parsed = new URL(xmlUrl);
    const seasonId = parsed.searchParams.get("i");

    return seasonId ? `${parsed.origin}/saison/${seasonId}` : null;
  } catch {
    return null;
  }
}
