import { DbGender, DbPosition } from "../../src/data/supabaseMappers";
import { isGeneratedAvatarOption } from "../../src/domain/avatarOptions";
import { CloudflareEnv } from "../_shared/env";
import { requireWritableMember } from "../_shared/auth";
import { jsonResponse, readJsonBody } from "../_shared/http";
import {
  getPlayerWithPositions,
  replacePlayerPositions,
  updatePlayerCoreProfile,
} from "../_shared/supabase";

const validGenders = new Set<DbGender>(["female", "male", "diverse"]);
const validPositions = new Set<DbPosition>(["setter", "outside", "middle", "opposite", "libero"]);

interface ProfileInput {
  displayName?: unknown;
  gender?: unknown;
  positions?: unknown;
  primaryPosition?: unknown;
  avatar?: unknown;
}

interface ValidProfileInput {
  displayName: string;
  gender: DbGender;
  positions: DbPosition[];
  primaryPosition: DbPosition;
  avatar: {
    kind: "generated";
    style: string;
    seed: string;
  };
}

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireWritableMember(request, env);

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
  const authenticated = await requireWritableMember(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<ProfileInput>(request);
  const validation = validateProfileInput(body);

  if ("error" in validation) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  try {
    await updatePlayerCoreProfile(env, authenticated.selectedPlayerId, {
      display_name: validation.displayName,
      gender: validation.gender,
      avatar_kind: validation.avatar.kind,
      avatar_style: validation.avatar.style,
      avatar_seed: validation.avatar.seed,
      avatar_storage_path: null,
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
    if (error instanceof Error && error.message.includes("avatar_")) {
      return jsonResponse({ error: "profile_migration_required" }, { status: 409 });
    }

    throw error;
  }

  const player = await getPlayerWithPositions(env, authenticated.selectedPlayerId);

  if (!player) {
    return jsonResponse({ error: "profile_not_found" }, { status: 404 });
  }

  return jsonResponse({ profile: mapProfile(player) });
};

function validateProfileInput(body: ProfileInput | null): ValidProfileInput | { error: string } {
  if (!body) {
    return { error: "invalid_json" };
  }

  if (typeof body.displayName !== "string") {
    return { error: "display_name_required" };
  }

  const displayName = body.displayName.trim();

  if (displayName.length === 0 || displayName.length > 80) {
    return { error: "display_name_invalid" };
  }

  if (typeof body.gender !== "string" || !validGenders.has(body.gender as DbGender)) {
    return { error: "gender_invalid" };
  }

  if (!Array.isArray(body.positions)) {
    return { error: "positions_required" };
  }

  const positions = Array.from(new Set(body.positions));

  if (
    positions.length === 0 ||
    positions.some((position) => typeof position !== "string" || !validPositions.has(position as DbPosition))
  ) {
    return { error: "positions_invalid" };
  }

  if (typeof body.primaryPosition !== "string" || !positions.includes(body.primaryPosition)) {
    return { error: "primary_position_invalid" };
  }

  if (!isGeneratedAvatarOption(body.avatar)) {
    return { error: "avatar_invalid" };
  }

  return {
    displayName,
    gender: body.gender as DbGender,
    positions: positions as DbPosition[],
    primaryPosition: body.primaryPosition as DbPosition,
    avatar: {
      kind: "generated",
      style: body.avatar.style,
      seed: body.avatar.seed,
    },
  };
}

function mapProfile(player: {
  id: string;
  display_name: string;
  gender: DbGender;
  avatar_kind?: "generated" | "uploaded";
  avatar_style?: string | null;
  avatar_seed?: string | null;
  player_positions?: Array<{ position: DbPosition; is_primary: boolean }>;
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
  };
}
