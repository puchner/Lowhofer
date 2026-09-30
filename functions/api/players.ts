import { CloudflareEnv } from "../_shared/env";
import { requireAdmin, requireSelectedPlayer } from "../_shared/auth";
import { jsonResponse, readJsonBody } from "../_shared/http";
import { validatePlayerProfileInput } from "../_shared/playerProfile";
import { createPlayerWithPositions, listActiveLoginAccounts, listActiveTeamPlayers } from "../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const scope = new URL(request.url).searchParams.get("scope");
  const isLoginScope = scope === "login";
  if (!isLoginScope) {
    const authenticated = await requireSelectedPlayer(request, env);
    if (authenticated instanceof Response) return authenticated;
  }
  const players = scope === "login" ? await listActiveLoginAccounts(env) : await listActiveTeamPlayers(env);

  return jsonResponse({
    players: players.map((player) => ({
      id: player.id,
      displayName: player.display_name,
      role: player.role ?? "member",
      gender: player.gender,
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
      tempUnavailableReason: player.temp_unavailable_reason ?? null,
      tempUnavailableNote: player.temp_unavailable_note ?? null,
    })),
  });
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireAdmin(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<Parameters<typeof validatePlayerProfileInput>[0]>(request);
  const validation = validatePlayerProfileInput(body);

  if ("error" in validation) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  try {
    const player = await createPlayerWithPositions(env, validation);

    return jsonResponse(
      {
        player: {
          id: player.id,
          displayName: player.display_name,
          gender: player.gender,
          avatar:
            player.avatar_kind === "generated" && player.avatar_style && player.avatar_seed
              ? { kind: "generated", style: player.avatar_style, seed: player.avatar_seed }
              : undefined,
          positions: (player.player_positions ?? []).map((position) => ({
            position: position.position,
            isPrimary: position.is_primary,
          })),
          tempUnavailableReason: player.temp_unavailable_reason ?? null,
          tempUnavailableNote: player.temp_unavailable_note ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("players_active_display_name_unique_idx")) {
      return jsonResponse({ error: "display_name_already_exists" }, { status: 409 });
    }

    throw error;
  }
};
