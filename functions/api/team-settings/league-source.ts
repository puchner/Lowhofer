import { requireAdmin, requireSelectedPlayer } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { deriveLeagueUrls, validateLeagueBaseUrl } from "../../_shared/leagueSource";
import { getTeamLeagueSettings, invalidateLeagueCache, updateTeamLeagueSource } from "../../_shared/supabase";

const FALLBACK_LEAGUE_BASE_URL = "https://www.volleyball-freizeit.de/saison/1083";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const settings = await getTeamLeagueSettings(env);
  const leagueBaseUrl =
    settings?.league_base_url ?? deriveLeagueBaseUrl(settings?.league_table_url) ?? FALLBACK_LEAGUE_BASE_URL;

  return jsonResponse({
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

  const body = await readJsonBody<{ leagueBaseUrl?: string }>(request);

  if (!body?.leagueBaseUrl) {
    return jsonResponse({ error: "leagueBaseUrl_required" }, { status: 400 });
  }

  const { leagueBaseUrl } = body;

  if (!validateLeagueBaseUrl(leagueBaseUrl)) {
    return jsonResponse({ error: "invalid_url" }, { status: 400 });
  }

  let tableUrl: string;
  let fixturesUrl: string;

  try {
    const derived = await deriveLeagueUrls(leagueBaseUrl);
    tableUrl = derived.tableUrl;
    fixturesUrl = derived.fixturesUrl;
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "url_derivation_failed" },
      { status: 422 },
    );
  }

  await updateTeamLeagueSource(env, leagueBaseUrl, tableUrl, fixturesUrl);
  await invalidateLeagueCache(env);

  return jsonResponse({
    leagueBaseUrl,
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
