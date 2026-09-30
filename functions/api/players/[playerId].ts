import type { DbGender, DbPosition } from "../../../src/data/supabaseMappers";
import { requireAdmin } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { validatePlayerProfileInput } from "../../_shared/playerProfile";
import {
  countActiveAdmins,
  deletePlayer,
  findActivePlayerByDisplayName,
  getPlayerWithPositions,
  replacePlayerPositions,
  updatePlayerCoreProfile,
} from "../../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv, "playerId"> = async ({ request, env, params }) => {
  const authenticated = await requireAdmin(request, env);
  if (authenticated instanceof Response) return authenticated;
  const playerId = routePlayerId(params.playerId);
  const player = await getPlayerWithPositions(env, playerId);
  if (!player) return jsonResponse({ error: "player_not_found" }, { status: 404 });
  return jsonResponse({ player: mapPlayer(player) });
};

export const onRequestPatch: PagesFunction<CloudflareEnv, "playerId"> = async ({ request, env, params }) => {
  const authenticated = await requireAdmin(request, env);
  if (authenticated instanceof Response) return authenticated;
  const playerId = routePlayerId(params.playerId);
  const existing = await getPlayerWithPositions(env, playerId);
  if (!existing) return jsonResponse({ error: "player_not_found" }, { status: 404 });
  const validation = validatePlayerProfileInput(await readJsonBody(request));
  if ("error" in validation) return jsonResponse({ error: validation.error }, { status: 400 });

  try {
    const existingNameOwner = await findActivePlayerByDisplayName(env, validation.displayName);
    if (existingNameOwner && existingNameOwner.id !== playerId) {
      return jsonResponse({ error: "display_name_already_exists" }, { status: 409 });
    }
    await updatePlayerCoreProfile(env, playerId, {
      display_name: validation.displayName,
      gender: validation.gender,
      avatar_kind: validation.avatar.kind,
      avatar_style: validation.avatar.style,
      avatar_seed: validation.avatar.seed,
      avatar_storage_path: null,
      temp_unavailable_reason: validation.tempUnavailableReason,
      temp_unavailable_note: validation.tempUnavailableNote,
    });
    await replacePlayerPositions(env, playerId, validation.positions.map((position) => ({
      position,
      is_primary: position === validation.primaryPosition,
    })));
  } catch (error) {
    if (error instanceof Error && error.message.includes("players_active_display_name_unique_idx")) {
      return jsonResponse({ error: "display_name_already_exists" }, { status: 409 });
    }
    throw error;
  }
  const player = await getPlayerWithPositions(env, playerId);
  return player ? jsonResponse({ player: mapPlayer(player) }) : jsonResponse({ error: "player_not_found" }, { status: 404 });
};

export const onRequestDelete: PagesFunction<CloudflareEnv, "playerId"> = async ({ request, env, params }) => {
  const authenticated = await requireAdmin(request, env);
  if (authenticated instanceof Response) return authenticated;
  const playerId = routePlayerId(params.playerId);
  const player = await getPlayerWithPositions(env, playerId);
  if (!player) return jsonResponse({ error: "player_not_found" }, { status: 404 });
  if (authenticated.selectedPlayerId === playerId) {
    return jsonResponse({ error: "cannot_delete_own_account" }, { status: 409 });
  }
  if (player.is_admin && player.is_active && (await countActiveAdmins(env)) <= 1) {
    return jsonResponse({ error: "last_admin_cannot_be_deleted" }, { status: 409 });
  }
  await deletePlayer(env, playerId);
  return jsonResponse({ success: true });
};

function routePlayerId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function mapPlayer(player: {
  id: string;
  display_name: string;
  gender: DbGender;
  avatar_kind?: "generated" | "uploaded";
  avatar_style?: string | null;
  avatar_seed?: string | null;
  temp_unavailable_reason?: "illness_injury" | "travel" | "other" | null;
  temp_unavailable_note?: string | null;
  player_positions?: Array<{ position: DbPosition; is_primary: boolean }>;
}) {
  return {
    id: player.id,
    displayName: player.display_name,
    gender: player.gender,
    avatar: player.avatar_kind && player.avatar_style && player.avatar_seed
      ? { kind: player.avatar_kind, style: player.avatar_style, seed: player.avatar_seed }
      : undefined,
    positions: (player.player_positions ?? []).map((position) => ({
      position: position.position,
      isPrimary: position.is_primary,
    })),
    tempUnavailableReason: player.temp_unavailable_reason ?? null,
    tempUnavailableNote: player.temp_unavailable_note ?? null,
  };
}
