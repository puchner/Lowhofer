import type { DbPlayerRow, DbPlayerWithPositions } from "../../src/data/supabaseMappers";
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

async function supabaseFetch<T>(env: CloudflareEnv, path: string, init: RequestInit = {}): Promise<T> {
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

  return (await response.json()) as T;
}
