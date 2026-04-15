import { CloudflareEnv } from "../_shared/env";
import { jsonResponse } from "../_shared/http";
import { listActivePlayers } from "../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ env }) => {
  const players = await listActivePlayers(env);

  return jsonResponse({
    players: players.map((player) => ({
      id: player.id,
      displayName: player.display_name,
      gender: player.gender,
      isAdmin: player.is_admin,
      avatar: player.avatar_kind
        ? {
            kind: player.avatar_kind,
            style: player.avatar_style ?? undefined,
            seed: player.avatar_seed ?? undefined,
          }
        : undefined,
      positions: (player.player_positions ?? []).map((position) => ({
        position: position.position,
        isPrimary: position.is_primary,
      })),
    })),
  });
};
