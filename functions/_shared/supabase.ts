import type {
  DbAvailabilityPollRow,
  DbAvailabilityResponseRow,
  DbPlayerRow,
  DbPlayerWithPositions,
} from "../../src/data/supabaseMappers";
import { CloudflareEnv, getRequiredEnv } from "./env";

interface TeamSettingsPasswordRow {
  team_password_hash: string;
}

export async function getTeamPasswordHash(env: CloudflareEnv): Promise<string | null> {
  const rows = await supabaseFetch<TeamSettingsPasswordRow[]>(env, "/team_settings?select=team_password_hash&limit=1");

  return rows[0]?.team_password_hash ?? null;
}

export async function listActivePlayers(env: CloudflareEnv): Promise<DbPlayerWithPositions[]> {
  return supabaseFetch<DbPlayerWithPositions[]>(
    env,
    "/players?select=id,display_name,gender,is_active,is_admin,sort_order,created_at,updated_at,player_positions(id,player_id,position,is_primary)&is_active=eq.true&order=sort_order.asc",
  );
}

export async function getActivePlayer(env: CloudflareEnv, playerId: string): Promise<DbPlayerRow | null> {
  const rows = await supabaseFetch<DbPlayerRow[]>(
    env,
    `/players?select=id,display_name,gender,is_active,is_admin,sort_order,created_at,updated_at&id=eq.${encodeURIComponent(
      playerId,
    )}&is_active=eq.true&limit=1`,
  );

  return rows[0] ?? null;
}

export async function listPolls(env: CloudflareEnv): Promise<DbAvailabilityPollRow[]> {
  return supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    "/availability_polls?select=*&order=starts_at.asc.nullslast,created_at.asc",
  );
}

export async function getPoll(env: CloudflareEnv, pollId: string): Promise<DbAvailabilityPollRow | null> {
  const rows = await supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    `/availability_polls?select=*&id=eq.${encodeURIComponent(pollId)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function listResponses(env: CloudflareEnv): Promise<DbAvailabilityResponseRow[]> {
  return supabaseFetch<DbAvailabilityResponseRow[]>(
    env,
    "/availability_responses?select=*&order=updated_at.asc",
  );
}

export async function listResponsesForPoll(
  env: CloudflareEnv,
  pollId: string,
): Promise<DbAvailabilityResponseRow[]> {
  return supabaseFetch<DbAvailabilityResponseRow[]>(
    env,
    `/availability_responses?select=*&poll_id=eq.${encodeURIComponent(pollId)}&order=updated_at.asc`,
  );
}

export async function createPoll(
  env: CloudflareEnv,
  poll: Record<string, unknown>,
): Promise<DbAvailabilityPollRow> {
  const rows = await supabaseFetch<DbAvailabilityPollRow[]>(env, "/availability_polls", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(poll),
  });

  return rows[0];
}

export async function updatePoll(
  env: CloudflareEnv,
  pollId: string,
  patch: Record<string, unknown>,
): Promise<DbAvailabilityPollRow | null> {
  const rows = await supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    `/availability_polls?id=eq.${encodeURIComponent(pollId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    },
  );

  return rows[0] ?? null;
}

export async function deletePoll(env: CloudflareEnv, pollId: string): Promise<void> {
  await supabaseFetch<void>(env, `/availability_polls?id=eq.${encodeURIComponent(pollId)}`, {
    method: "DELETE",
  });
}

export async function createResponses(
  env: CloudflareEnv,
  responses: Array<Record<string, unknown>>,
): Promise<void> {
  if (responses.length === 0) {
    return;
  }

  await supabaseFetch<void>(env, "/availability_responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(responses),
  });
}

export async function upsertResponse(
  env: CloudflareEnv,
  response: Record<string, unknown>,
): Promise<DbAvailabilityResponseRow> {
  const rows = await supabaseFetch<DbAvailabilityResponseRow[]>(
    env,
    "/availability_responses?on_conflict=poll_id,player_id",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(response),
    },
  );

  return rows[0];
}

export interface TeamLeagueSettings {
  league_base_url: string | null;
  league_table_url: string | null;
  league_fixtures_url: string | null;
}

export async function getTeamLeagueSettings(env: CloudflareEnv): Promise<TeamLeagueSettings | null> {
  const rows = await supabaseFetch<TeamLeagueSettings[]>(
    env,
    "/team_settings?select=league_base_url,league_table_url,league_fixtures_url&limit=1",
  );

  return rows[0] ?? null;
}

export async function updateTeamLeagueSource(
  env: CloudflareEnv,
  baseUrl: string,
  tableUrl: string,
  fixturesUrl: string,
): Promise<void> {
  await supabaseFetch<void>(env, "/team_settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      league_base_url: baseUrl,
      league_table_url: tableUrl,
      league_fixtures_url: fixturesUrl,
      updated_at: new Date().toISOString(),
    }),
  });
}

export interface LeagueCacheRow {
  cache_key: string;
  payload_json: unknown;
  fetched_at: string;
  expires_at: string;
  source_url: string;
}

export async function getLeagueCache(env: CloudflareEnv, key: "table" | "fixtures"): Promise<LeagueCacheRow | null> {
  const rows = await supabaseFetch<LeagueCacheRow[]>(env, `/league_cache?cache_key=eq.${key}&limit=1`);

  return rows[0] ?? null;
}

export async function setLeagueCache(
  env: CloudflareEnv,
  key: "table" | "fixtures",
  payload: unknown,
  sourceUrl: string,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  await supabaseFetch<void>(env, "/league_cache?on_conflict=cache_key", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      cache_key: key,
      payload_json: payload,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      source_url: sourceUrl,
    }),
  });
}

export async function invalidateLeagueCache(env: CloudflareEnv): Promise<void> {
  await supabaseFetch<void>(env, "/league_cache?cache_key=in.(table,fixtures)", { method: "DELETE" });
}

export async function supabaseFetch<T>(env: CloudflareEnv, path: string, init: RequestInit = {}): Promise<T> {
  const supabaseUrl = getRequiredEnv(env, "SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = getRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const headers = new Headers(init.headers);

  headers.set("apikey", serviceRoleKey);
  headers.set("authorization", `Bearer ${serviceRoleKey}`);
  headers.set("accept", "application/json");

  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
