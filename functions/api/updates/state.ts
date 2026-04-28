import { CloudflareEnv } from "../../_shared/env";
import { requireSelectedPlayer } from "../../_shared/auth";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { getPlayerUpdateState, upsertPlayerUpdateState } from "../../_shared/supabase";
import { canEditOwnProfile } from "../../../src/domain/permissions";
import type { PlayerRole } from "../../../src/domain/playerRoles";

const initialLastSeenUpdateAt = "1970-01-01T00:00:00.000Z";

interface UpdateStateInput {
  lastSeenUpdateAt?: unknown;
}

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  if (!canPersistUpdateState(authenticated)) {
    return jsonResponse({ lastSeenUpdateAt: new Date().toISOString() });
  }

  const state = await getPlayerUpdateState(env, authenticated.selectedPlayerId);

  return jsonResponse({
    lastSeenUpdateAt: state?.last_seen_update_at ?? initialLastSeenUpdateAt,
  });
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  if (!canPersistUpdateState(authenticated)) {
    return jsonResponse({ lastSeenUpdateAt: new Date().toISOString() });
  }

  const body = await readJsonBody<UpdateStateInput>(request);

  if (!body || typeof body.lastSeenUpdateAt !== "string") {
    return jsonResponse({ error: "last_seen_update_at_required" }, { status: 400 });
  }

  const lastSeenUpdateAt = new Date(body.lastSeenUpdateAt);

  if (Number.isNaN(lastSeenUpdateAt.getTime())) {
    return jsonResponse({ error: "last_seen_update_at_invalid" }, { status: 400 });
  }

  await upsertPlayerUpdateState(env, authenticated.selectedPlayerId, lastSeenUpdateAt.toISOString());

  return jsonResponse({ lastSeenUpdateAt: lastSeenUpdateAt.toISOString() });
};

function canPersistUpdateState(authenticated: { selectedPlayerIsAdmin: boolean; selectedPlayerRole?: PlayerRole | null }) {
  return canEditOwnProfile({
    isAdmin: authenticated.selectedPlayerIsAdmin,
    role: authenticated.selectedPlayerRole,
  });
}
