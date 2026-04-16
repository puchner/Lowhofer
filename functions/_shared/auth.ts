import { CloudflareEnv } from "./env";
import { jsonResponse } from "./http";
import { readSession, SessionPayload } from "./session";
import { getActivePlayer } from "./supabase";
import { DbPlayerRole } from "../../src/data/supabaseMappers";
import { isTrainingMemberRole } from "../../src/domain/playerRoles";

export interface AuthenticatedRequest {
  session: SessionPayload;
  selectedPlayerId: string;
  selectedPlayerIsAdmin: boolean;
  selectedPlayerRole: DbPlayerRole;
}

export async function requireSelectedPlayer(
  request: Request,
  env: CloudflareEnv,
): Promise<AuthenticatedRequest | Response> {
  const session = await readSession(request, env);

  if (!session) {
    return jsonResponse({ error: "not_authenticated" }, { status: 401 });
  }

  if (!session.selectedPlayerId) {
    return jsonResponse({ error: "player_required" }, { status: 403 });
  }

  const selectedPlayer = await getActivePlayer(env, session.selectedPlayerId);

  if (!selectedPlayer) {
    return jsonResponse({ error: "selected_player_not_found" }, { status: 403 });
  }

  return {
    session,
    selectedPlayerId: selectedPlayer.id,
    selectedPlayerIsAdmin: selectedPlayer.is_admin,
    selectedPlayerRole: selectedPlayer.role ?? "member",
  };
}

export async function requireAdmin(request: Request, env: CloudflareEnv): Promise<AuthenticatedRequest | Response> {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  if (!authenticated.selectedPlayerIsAdmin) {
    return jsonResponse({ error: "admin_required" }, { status: 403 });
  }

  return authenticated;
}

export async function requireWritableMember(
  request: Request,
  env: CloudflareEnv,
): Promise<AuthenticatedRequest | Response> {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  if (isTrainingMemberRole(authenticated.selectedPlayerRole)) {
    return jsonResponse({ error: "training_member_read_only" }, { status: 403 });
  }

  return authenticated;
}
