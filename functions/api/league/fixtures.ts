import { requireSelectedPlayer } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse } from "../../_shared/http";
import { parseLowhoferFixtures } from "../../_shared/leagueParser";
import { getLeagueCache, getTeamLeagueXmlUrls, setLeagueCache } from "../../_shared/supabase";

const FALLBACK_FIXTURES_URL = "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const cache = await getLeagueCache(env, "fixtures");
  const now = new Date();

  if (cache && new Date(cache.expires_at) > now) {
    return jsonResponse({
      fixtures: cache.payload_json,
      fetchedAt: cache.fetched_at,
      expiresAt: cache.expires_at,
      isStale: false,
    });
  }

  const settings = await getTeamLeagueXmlUrls(env);
  const fixturesUrl = settings?.league_fixtures_url ?? FALLBACK_FIXTURES_URL;

  try {
    const response = await fetch(fixturesUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const fixtures = parseLowhoferFixtures(xml);

    await setLeagueCache(env, "fixtures", fixtures, fixturesUrl);

    const freshCache = await getLeagueCache(env, "fixtures");

    return jsonResponse({
      fixtures,
      fetchedAt: freshCache?.fetched_at ?? now.toISOString(),
      expiresAt: freshCache?.expires_at,
      isStale: false,
    });
  } catch {
    if (cache) {
      return jsonResponse({
        fixtures: cache.payload_json,
        fetchedAt: cache.fetched_at,
        expiresAt: cache.expires_at,
        isStale: true,
      });
    }

    return jsonResponse({ error: "league_data_unavailable" }, { status: 503 });
  }
};
