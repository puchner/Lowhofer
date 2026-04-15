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

  const storedHash = await getTeamPasswordHash(env);

  if (!storedHash || !(await verifyPassword(password, storedHash))) {
    return jsonResponse({ error: "invalid_password" }, { status: 401 });
  }

  const headers = new Headers();
  headers.append("set-cookie", await createSessionCookie(request, env));

  return jsonResponse({ isAuthenticated: true, selectedPlayerId: null }, { headers });
};
