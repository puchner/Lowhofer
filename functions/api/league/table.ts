import { requireSelectedPlayer } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse } from "../../_shared/http";
import { parseLeagueTable } from "../../_shared/leagueParser";
import { getLeagueCache, getTeamLeagueSettings, setLeagueCache } from "../../_shared/supabase";

const FALLBACK_TABLE_URL = "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const cache = await getLeagueCache(env, "table");
  const now = new Date();

  if (cache && new Date(cache.expires_at) > now) {
    return jsonResponse({
      ...(cache.payload_json as object),
      fetchedAt: cache.fetched_at,
      expiresAt: cache.expires_at,
      isStale: false,
    });
  }

  const settings = await getTeamLeagueSettings(env);
  const tableUrl = settings?.league_table_url ?? FALLBACK_TABLE_URL;

  try {
    const response = await fetch(tableUrl, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = parseLeagueTable(xml);

    await setLeagueCache(env, "table", parsed, tableUrl);

    const freshCache = await getLeagueCache(env, "table");

    return jsonResponse({
      ...parsed,
      fetchedAt: freshCache?.fetched_at ?? now.toISOString(),
      expiresAt: freshCache?.expires_at,
      isStale: false,
    });
  } catch {
    if (cache) {
      return jsonResponse({
        ...(cache.payload_json as object),
        fetchedAt: cache.fetched_at,
        expiresAt: cache.expires_at,
        isStale: true,
      });
    }

    return jsonResponse({ error: "league_data_unavailable" }, { status: 503 });
  }
};
