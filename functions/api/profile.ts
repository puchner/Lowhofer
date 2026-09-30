import type { DbGender, DbPosition } from "../../src/data/supabaseMappers";
import { CloudflareEnv } from "../_shared/env";
import { requireProfileEditor } from "../_shared/auth";
import { jsonResponse, readJsonBody } from "../_shared/http";
import { validatePlayerProfileInput } from "../_shared/playerProfile";
import {
  findActivePlayerByDisplayName,
  getPlayerWithPositions,
  replacePlayerPositions,
  updatePlayerCoreProfile,
} from "../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireProfileEditor(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const player = await getPlayerWithPositions(env, authenticated.selectedPlayerId);

  if (!player) {
    return jsonResponse({ error: "profile_not_found" }, { status: 404 });
  }

  return jsonResponse({ profile: mapProfile(player) });
};

export const onRequestPatch: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireProfileEditor(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<Parameters<typeof validatePlayerProfileInput>[0]>(request);
  const validation = validatePlayerProfileInput(body);

  if ("error" in validation) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  try {
    const existingNameOwner = await findActivePlayerByDisplayName(env, validation.displayName);

    if (existingNameOwner && existingNameOwner.id !== authenticated.selectedPlayerId) {
      return jsonResponse({ error: "display_name_already_exists" }, { status: 409 });
    }

    await updatePlayerCoreProfile(env, authenticated.selectedPlayerId, {
      display_name: validation.displayName,
      gender: validation.gender,
      avatar_kind: validation.avatar.kind,
      avatar_style: validation.avatar.style,
      avatar_seed: validation.avatar.seed,
      avatar_storage_path: null,
      temp_unavailable_reason: validation.tempUnavailableReason,
      temp_unavailable_note: validation.tempUnavailableNote,
    });

    await replacePlayerPositions(
      env,
      authenticated.selectedPlayerId,
      validation.positions.map((position) => ({
        position,
        is_primary: position === validation.primaryPosition,
      })),
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("players_active_display_name_unique_idx")) {
      return jsonResponse({ error: "display_name_already_exists" }, { status: 409 });
    }

    throw error;
  }

  const player = await getPlayerWithPositions(env, authenticated.selectedPlayerId);

  if (!player) {
    return jsonResponse({ error: "profile_not_found" }, { status: 404 });
  }

  return jsonResponse({ profile: mapProfile(player) });
};

function mapProfile(player: {
  id: string;
  display_name: string;
  gender: DbGender;
  avatar_kind?: "generated" | "uploaded";
  avatar_style?: string | null;
  avatar_seed?: string | null;
  player_positions?: Array<{ position: DbPosition; is_primary: boolean }>;
  temp_unavailable_reason?: "illness_injury" | "travel" | "other" | null;
  temp_unavailable_note?: string | null;
}) {
  const positions = player.player_positions ?? [];

  return {
    id: player.id,
    displayName: player.display_name,
    gender: player.gender,
    avatar:
      player.avatar_kind === "generated" && player.avatar_style && player.avatar_seed
        ? {
            kind: "generated",
            style: player.avatar_style,
            seed: player.avatar_seed,
          }
        : undefined,
    positions: positions.map((position) => ({
      position: position.position,
      isPrimary: position.is_primary,
    })),
    tempUnavailableReason: player.temp_unavailable_reason ?? null,
    tempUnavailableNote: player.temp_unavailable_note ?? null,
  };
}
