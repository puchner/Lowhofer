import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse } from "../../_shared/http";
import { readSession } from "../../_shared/session";
import { getActivePlayer } from "../../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const session = await readSession(request, env);

  if (!session) {
    return jsonResponse({
      isAuthenticated: false,
      selectedPlayerId: null,
      selectedPlayerDisplayName: null,
      selectedPlayerIsAdmin: false,
      selectedPlayerRole: null,
    });
  }

  const selectedPlayer = session.selectedPlayerId ? await getActivePlayer(env, session.selectedPlayerId) : null;

  return jsonResponse({
    isAuthenticated: true,
    selectedPlayerId: selectedPlayer?.id ?? null,
    selectedPlayerDisplayName: selectedPlayer?.display_name ?? null,
    selectedPlayerIsAdmin: selectedPlayer?.is_admin ?? false,
    selectedPlayerRole: selectedPlayer?.role ?? null,
  });
};
