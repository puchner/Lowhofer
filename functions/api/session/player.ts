import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { createSessionCookie, readSession } from "../../_shared/session";
import { getActivePlayer } from "../../_shared/supabase";

interface SelectPlayerRequestBody {
  playerId?: string;
}

export const onRequestPost: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const session = await readSession(request, env);

  if (!session) {
    return jsonResponse({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await readJsonBody<SelectPlayerRequestBody>(request);
  const playerId = body?.playerId ?? "";

  if (!playerId) {
    return jsonResponse({ error: "player_required" }, { status: 400 });
  }

  const player = await getActivePlayer(env, playerId);

  if (!player) {
    return jsonResponse({ error: "player_not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.append("set-cookie", await createSessionCookie(request, env, player.id));

  return jsonResponse(
    {
      isAuthenticated: true,
      selectedPlayerId: player.id,
      selectedPlayerDisplayName: player.display_name,
      selectedPlayerIsAdmin: player.is_admin,
    },
    { headers },
  );
};
