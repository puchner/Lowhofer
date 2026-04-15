import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { createSessionCookie } from "../../_shared/session";
import { verifyPassword } from "../../_shared/password";
import { getTeamPasswordHash } from "../../_shared/supabase";

interface LoginRequestBody {
  password?: string;
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

  const headers = new Headers();

  try {
    headers.append("set-cookie", await createSessionCookie(request, env));
  } catch (error) {
    console.error("Could not create session cookie.", error);

    return jsonResponse({ error: "session_cookie_failed" }, { status: 500 });
  }

  return jsonResponse({ isAuthenticated: true, selectedPlayerId: null }, { headers });
};
