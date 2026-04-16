import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { createSessionCookie } from "../../_shared/session";
import { verifyPassword } from "../../_shared/password";
import { getActivePlayer, getTeamPasswordHash } from "../../_shared/supabase";

interface LoginRequestBody {
  password?: string;
  playerId?: string;
}

export const onRequestPost: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const body = await readJsonBody<LoginRequestBody>(request);
  const password = body?.password?.trim() ?? "";

  if (!password) {
    return jsonResponse({ error: "password_required" }, { status: 400 });
  }

  let storedHash: string | null;

  try {
    storedHash = await getTeamPasswordHash(env);
  } catch (error) {
    console.error("Could not load team password hash.", error);

    return jsonResponse({ error: "team_settings_unavailable" }, { status: 503 });
  }

  let isPasswordValid = false;

  try {
    isPasswordValid = storedHash ? await verifyPassword(password, storedHash) : false;
  } catch (error) {
    console.error("Could not verify team password hash.", error);

    return jsonResponse(
      {
        error: "password_hash_invalid",
        reason: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }

  if (!isPasswordValid) {
    return jsonResponse({ error: "invalid_password" }, { status: 401 });
  }

  const selectedPlayer = body?.playerId ? await getActivePlayer(env, body.playerId) : null;

  if (body?.playerId && !selectedPlayer) {
    return jsonResponse({ error: "player_not_found" }, { status: 404 });
  }

  const headers = new Headers();

  try {
    headers.append("set-cookie", await createSessionCookie(request, env, selectedPlayer?.id));
  } catch (error) {
    console.error("Could not create session cookie.", error);

    return jsonResponse({ error: "session_cookie_failed" }, { status: 500 });
  }

  return jsonResponse(
    {
      isAuthenticated: true,
      selectedPlayerId: selectedPlayer?.id ?? null,
      selectedPlayerDisplayName: selectedPlayer?.display_name ?? null,
      selectedPlayerIsAdmin: selectedPlayer?.is_admin ?? false,
      selectedPlayerRole: selectedPlayer?.role ?? null,
    },
    { headers },
  );
};
