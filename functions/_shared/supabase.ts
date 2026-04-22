import type {
  DbAvailabilityPollRow,
  DbAvailabilityPollWithAppointmentRow,
  DbAvailabilityResponseRow,
  DbHomeAway,
  DbMatchAppointmentRow,
  DbMatchAppointmentWithMatchRow,
  DbMatchRow,
  DbSourceType,
  DbPlayerRow,
  DbPlayerWithPositions,
} from "../../src/data/supabaseMappers";
import { CloudflareEnv, getRequiredEnv } from "./env";

interface TeamSettingsPasswordRow {
  team_password_hash: string;
}

const playerSelect =
  "id,display_name,gender,is_active,is_admin,role,sort_order,avatar_kind,avatar_style,avatar_seed,avatar_storage_path,created_at,updated_at";
const pollWithAppointmentSelect =
  "*,match_appointments!availability_polls_match_appointment_id_fkey(*,matches(*))";

export async function getTeamPasswordHash(env: CloudflareEnv): Promise<string | null> {
  const rows = await supabaseFetch<TeamSettingsPasswordRow[]>(env, "/team_settings?select=team_password_hash&limit=1");

  return rows[0]?.team_password_hash ?? null;
}

export async function listActivePlayers(env: CloudflareEnv): Promise<DbPlayerWithPositions[]> {
  return listActiveTeamPlayers(env);
}

export async function listActiveTeamPlayers(env: CloudflareEnv): Promise<DbPlayerWithPositions[]> {
  return supabaseFetch<DbPlayerWithPositions[]>(
    env,
    `/players?select=${playerSelect},player_positions(id,player_id,position,is_primary)&is_active=eq.true&role=neq.training_member&order=sort_order.asc`,
  );
}

export async function listActiveLoginAccounts(env: CloudflareEnv): Promise<DbPlayerWithPositions[]> {
  return supabaseFetch<DbPlayerWithPositions[]>(
    env,
    `/players?select=${playerSelect},player_positions(id,player_id,position,is_primary)&is_active=eq.true&order=sort_order.asc`,
  );
}

export async function getActivePlayer(env: CloudflareEnv, playerId: string): Promise<DbPlayerRow | null> {
  const rows = await supabaseFetch<DbPlayerRow[]>(
    env,
    `/players?select=id,display_name,gender,is_active,is_admin,role,sort_order,created_at,updated_at&id=eq.${encodeURIComponent(
      playerId,
    )}&is_active=eq.true&limit=1`,
  );

  return rows[0] ?? null;
}

export async function getPlayerWithPositions(
  env: CloudflareEnv,
  playerId: string,
): Promise<DbPlayerWithPositions | null> {
  const rows = await supabaseFetch<DbPlayerWithPositions[]>(
    env,
    `/players?select=${playerSelect},player_positions(id,player_id,position,is_primary)&id=eq.${encodeURIComponent(
      playerId,
    )}&is_active=eq.true&limit=1`,
  );

  return rows[0] ?? null;
}

export async function findActivePlayerByDisplayName(
  env: CloudflareEnv,
  displayName: string,
): Promise<Pick<DbPlayerRow, "id" | "display_name"> | null> {
  const rows = await supabaseFetch<Pick<DbPlayerRow, "id" | "display_name">[]>(
    env,
    `/players?select=id,display_name&display_name=ilike.${encodeURIComponent(displayName)}&is_active=eq.true&limit=1`,
  );

  return rows[0] ?? null;
}

export async function updatePlayerCoreProfile(
  env: CloudflareEnv,
  playerId: string,
  patch: Record<string, unknown>,
): Promise<DbPlayerRow | null> {
  const rows = await supabaseFetch<DbPlayerRow[]>(env, `/players?id=eq.${encodeURIComponent(playerId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });

  return rows[0] ?? null;
}

export async function replacePlayerPositions(
  env: CloudflareEnv,
  playerId: string,
  positions: Array<{ position: string; is_primary: boolean }>,
): Promise<void> {
  await supabaseFetch<void>(env, `/player_positions?player_id=eq.${encodeURIComponent(playerId)}`, {
    method: "DELETE",
  });

  if (positions.length === 0) {
    return;
  }

  await supabaseFetch<void>(env, "/player_positions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(
      positions.map((position) => ({
        player_id: playerId,
        position: position.position,
        is_primary: position.is_primary,
      })),
    ),
  });
}

export async function listPolls(env: CloudflareEnv): Promise<DbAvailabilityPollRow[]> {
  return supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    "/availability_polls?select=*&order=created_at.asc",
  );
}

export async function listPollsWithAppointments(env: CloudflareEnv): Promise<DbAvailabilityPollWithAppointmentRow[]> {
  return supabaseFetch<DbAvailabilityPollWithAppointmentRow[]>(
    env,
    `/availability_polls?select=${pollWithAppointmentSelect}&order=created_at.asc`,
  );
}

export async function getPoll(env: CloudflareEnv, pollId: string): Promise<DbAvailabilityPollRow | null> {
  const rows = await supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    `/availability_polls?select=*&id=eq.${encodeURIComponent(pollId)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function getPollWithAppointment(
  env: CloudflareEnv,
  pollId: string,
): Promise<DbAvailabilityPollWithAppointmentRow | null> {
  const rows = await supabaseFetch<DbAvailabilityPollWithAppointmentRow[]>(
    env,
    `/availability_polls?select=${pollWithAppointmentSelect}&id=eq.${encodeURIComponent(pollId)}&limit=1`,
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

export async function createPollForAppointment(
  env: CloudflareEnv,
  appointmentId: string,
  poll: Record<string, unknown>,
): Promise<DbAvailabilityPollRow> {
  return createPoll(env, {
    ...poll,
    match_appointment_id: appointmentId,
  });
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

export async function deleteAppointment(env: CloudflareEnv, appointmentId: string): Promise<void> {
  await supabaseFetch<void>(env, `/match_appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
    method: "DELETE",
  });
}

export interface LeagueMatchInput {
  leagueGameNr: string;
  seasonKey: string;
  teamKey: string;
  opponentName: string;
  homeAway: DbHomeAway;
  notes?: string | null;
}

export interface CustomMatchInput {
  opponentName: string;
  homeAway: DbHomeAway;
  teamKey?: string | null;
  notes?: string | null;
}

export interface AppointmentInput {
  matchId: string;
  startsAt?: string | null;
  hasTime?: boolean;
  status: DbMatchAppointmentRow["status"];
  location?: string | null;
  sourceType?: DbSourceType;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export async function getMatch(env: CloudflareEnv, matchId: string): Promise<DbMatchRow | null> {
  const rows = await supabaseFetch<DbMatchRow[]>(
    env,
    `/matches?select=*&id=eq.${encodeURIComponent(matchId)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function findLeagueMatch(
  env: CloudflareEnv,
  leagueGameNr: string,
  seasonKey: string,
  teamKey: string,
): Promise<DbMatchRow | null> {
  const rows = await supabaseFetch<DbMatchRow[]>(
    env,
    `/matches?select=*&source_type=eq.league&league_game_nr=eq.${encodeURIComponent(
      leagueGameNr,
    )}&season_key=eq.${encodeURIComponent(seasonKey)}&team_key=eq.${encodeURIComponent(teamKey)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function upsertLeagueMatch(env: CloudflareEnv, input: LeagueMatchInput): Promise<DbMatchRow> {
  const existingMatch = await findLeagueMatch(env, input.leagueGameNr, input.seasonKey, input.teamKey);
  const payload = {
    source_type: "league",
    league_game_nr: input.leagueGameNr,
    season_key: input.seasonKey,
    team_key: input.teamKey,
    opponent_name: input.opponentName,
    home_away: input.homeAway,
    notes: input.notes ?? null,
  };

  if (existingMatch) {
    const updatedMatch = await updateMatch(env, existingMatch.id, payload);

    return updatedMatch ?? existingMatch;
  }

  return createMatch(env, payload);
}

export async function createCustomMatch(env: CloudflareEnv, input: CustomMatchInput): Promise<DbMatchRow> {
  return createMatch(env, {
    source_type: "custom",
    league_game_nr: null,
    season_key: null,
    team_key: input.teamKey ?? "lowhofer",
    opponent_name: input.opponentName,
    home_away: input.homeAway,
    notes: input.notes ?? null,
  });
}

export async function createMatch(env: CloudflareEnv, match: Record<string, unknown>): Promise<DbMatchRow> {
  const rows = await supabaseFetch<DbMatchRow[]>(env, "/matches", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(match),
  });

  return rows[0];
}

export async function updateMatch(
  env: CloudflareEnv,
  matchId: string,
  patch: Record<string, unknown>,
): Promise<DbMatchRow | null> {
  const rows = await supabaseFetch<DbMatchRow[]>(env, `/matches?id=eq.${encodeURIComponent(matchId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });

  return rows[0] ?? null;
}

export async function getAppointment(
  env: CloudflareEnv,
  appointmentId: string,
): Promise<DbMatchAppointmentRow | null> {
  const rows = await supabaseFetch<DbMatchAppointmentRow[]>(
    env,
    `/match_appointments?select=*&id=eq.${encodeURIComponent(appointmentId)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function listAppointmentsForMatch(
  env: CloudflareEnv,
  matchId: string,
): Promise<DbMatchAppointmentRow[]> {
  return supabaseFetch<DbMatchAppointmentRow[]>(
    env,
    `/match_appointments?select=*&match_id=eq.${encodeURIComponent(matchId)}&order=starts_at.asc.nullslast,created_at.asc`,
  );
}

export async function listScheduledCalendarAppointments(
  env: CloudflareEnv,
): Promise<DbMatchAppointmentWithMatchRow[]> {
  return supabaseFetch<DbMatchAppointmentWithMatchRow[]>(
    env,
    "/match_appointments?select=*,matches(*)&status=eq.scheduled&starts_at=not.is.null&order=starts_at.asc",
  );
}

export async function listPollsForAppointment(
  env: CloudflareEnv,
  appointmentId: string,
): Promise<DbAvailabilityPollRow[]> {
  return supabaseFetch<DbAvailabilityPollRow[]>(
    env,
    `/availability_polls?select=*&match_appointment_id=eq.${encodeURIComponent(appointmentId)}&order=created_at.asc`,
  );
}

export async function createAppointment(env: CloudflareEnv, input: AppointmentInput): Promise<DbMatchAppointmentRow> {
  const rows = await supabaseFetch<DbMatchAppointmentRow[]>(env, "/match_appointments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(appointmentInputToRow(input)),
  });

  return rows[0];
}

export async function updateAppointment(
  env: CloudflareEnv,
  appointmentId: string,
  patch: Record<string, unknown>,
): Promise<DbMatchAppointmentRow | null> {
  const rows = await supabaseFetch<DbMatchAppointmentRow[]>(
    env,
    `/match_appointments?id=eq.${encodeURIComponent(appointmentId)}`,
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

function appointmentInputToRow(input: AppointmentInput): Record<string, unknown> {
  return {
    match_id: input.matchId,
    starts_at: input.startsAt ?? null,
    has_time: input.hasTime ?? Boolean(input.startsAt),
    status: input.status,
    location: input.location ?? null,
    source_type: input.sourceType ?? "custom",
    cancelled_at: input.cancelledAt ?? null,
    cancellation_reason: input.cancellationReason ?? null,
  };
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

export interface TeamLeagueXmlUrls {
  league_table_url: string | null;
  league_fixtures_url: string | null;
}

export interface TeamLeagueSettings extends TeamLeagueXmlUrls {
  league_base_url: string | null;
}

/** Nur die XML-Abruf-URLs – funktioniert auch ohne die league_base_url-Migration. */
export async function getTeamLeagueXmlUrls(env: CloudflareEnv): Promise<TeamLeagueXmlUrls | null> {
  const rows = await supabaseFetch<TeamLeagueXmlUrls[]>(
    env,
    "/team_settings?select=league_table_url,league_fixtures_url&limit=1",
  );

  return rows[0] ?? null;
}

/** Vollständige Liga-Einstellungen inkl. Basis-URL – erfordert die Migration aus Paket 5. */
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

export interface PlayerUpdateStateRow {
  player_id: string;
  last_seen_update_at: string;
  updated_at: string;
}

export async function getPlayerUpdateState(env: CloudflareEnv, playerId: string): Promise<PlayerUpdateStateRow | null> {
  const rows = await supabaseFetch<PlayerUpdateStateRow[]>(
    env,
    `/player_update_state?player_id=eq.${encodeURIComponent(playerId)}&limit=1`,
  );

  return rows[0] ?? null;
}

export async function upsertPlayerUpdateState(
  env: CloudflareEnv,
  playerId: string,
  lastSeenUpdateAt: string,
): Promise<void> {
  await supabaseFetch<void>(env, "/player_update_state?on_conflict=player_id", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      player_id: playerId,
      last_seen_update_at: lastSeenUpdateAt,
    }),
  });
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
