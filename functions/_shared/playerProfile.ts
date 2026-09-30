import { isGeneratedAvatarOption } from "../../src/domain/avatarOptions";
import { DbGender, DbPosition } from "../../src/data/supabaseMappers";
import type { TemporaryUnavailabilityReason } from "../../src/domain/types";

const validGenders = new Set<DbGender>(["female", "male", "diverse"]);
const validPositions = new Set<DbPosition>(["setter", "outside", "middle", "opposite", "libero"]);

export interface PlayerProfileInput {
  displayName: string;
  gender: DbGender;
  positions: DbPosition[];
  primaryPosition: DbPosition;
  avatar: {
    kind: "generated";
    style: string;
    seed: string;
  };
  tempUnavailableReason: TemporaryUnavailabilityReason | null;
  tempUnavailableNote: string | null;
}

interface RawPlayerProfileInput {
  displayName?: unknown;
  gender?: unknown;
  positions?: unknown;
  primaryPosition?: unknown;
  avatar?: unknown;
  tempUnavailableReason?: unknown;
  tempUnavailableNote?: unknown;
}

export function validatePlayerProfileInput(
  body: RawPlayerProfileInput | null,
): PlayerProfileInput | { error: string } {
  if (!body) return { error: "invalid_json" };
  if (typeof body.displayName !== "string") return { error: "display_name_required" };

  const displayName = body.displayName.trim();
  if (displayName.length === 0 || displayName.length > 80) return { error: "display_name_invalid" };
  if (typeof body.gender !== "string" || !validGenders.has(body.gender as DbGender)) {
    return { error: "gender_invalid" };
  }
  if (!Array.isArray(body.positions)) return { error: "positions_required" };

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
  if (!isGeneratedAvatarOption(body.avatar)) return { error: "avatar_invalid" };
  const validTempUnavailableReasons = new Set<TemporaryUnavailabilityReason>(["illness_injury", "travel", "other"]);
  const tempUnavailableReason = body.tempUnavailableReason === null || body.tempUnavailableReason === undefined
    ? null
    : typeof body.tempUnavailableReason === "string" && validTempUnavailableReasons.has(body.tempUnavailableReason as TemporaryUnavailabilityReason)
      ? body.tempUnavailableReason as TemporaryUnavailabilityReason
      : undefined;
  if (tempUnavailableReason === undefined) return { error: "temp_unavailable_reason_invalid" };
  if (body.tempUnavailableNote !== undefined && body.tempUnavailableNote !== null && typeof body.tempUnavailableNote !== "string") {
    return { error: "temp_unavailable_note_invalid" };
  }
  const tempUnavailableNote = typeof body.tempUnavailableNote === "string" ? body.tempUnavailableNote.trim() : "";
  if (tempUnavailableNote.length > 500) return { error: "temp_unavailable_note_invalid" };

  return {
    displayName,
    gender: body.gender as DbGender,
    positions: positions as DbPosition[],
    primaryPosition: body.primaryPosition as DbPosition,
    avatar: { kind: "generated", style: body.avatar.style, seed: body.avatar.seed },
    tempUnavailableReason,
    tempUnavailableNote: tempUnavailableReason && tempUnavailableNote ? tempUnavailableNote : null,
  };
}
