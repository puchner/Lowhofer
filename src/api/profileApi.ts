import { dbPositionToPosition, positionToDbPosition, type DbGender, type DbPosition } from "../data/supabaseMappers";
import { Gender, Player, PlayerAvatar, Position, TemporaryUnavailabilityReason } from "../domain/types";

interface ApiProfile {
  id: string;
  displayName: string;
  gender: DbGender;
  avatar?: PlayerAvatar;
  positions: Array<{
    position: DbPosition;
    isPrimary: boolean;
  }>;
  tempUnavailableReason?: TemporaryUnavailabilityReason | null;
  tempUnavailableNote?: string | null;
}

export interface UpdateProfileInput {
  displayName: string;
  gender: Gender;
  positions: Position[];
  primaryPosition: Position;
  avatar: {
    kind: "generated";
    style: string;
    seed: string;
  };
  tempUnavailableReason: TemporaryUnavailabilityReason | null;
  tempUnavailableNote?: string;
}

export async function fetchProfile(): Promise<Player> {
  const body = await requestJson<{ profile: ApiProfile }>("/api/profile");

  return mapApiProfile(body.profile);
}

export async function updateProfile(input: UpdateProfileInput): Promise<Player> {
  const body = await requestJson<{ profile: ApiProfile }>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: input.displayName,
      gender: input.gender,
      positions: input.positions.map(positionToDbPosition),
      primaryPosition: positionToDbPosition(input.primaryPosition),
      avatar: input.avatar,
      tempUnavailableReason: input.tempUnavailableReason,
      tempUnavailableNote: input.tempUnavailableNote ?? null,
    }),
  });

  return mapApiProfile(body.profile);
}

export async function createPlayer(input: UpdateProfileInput): Promise<Player> {
  const body = await requestJson<{ player: ApiProfile }>("/api/players", {
    method: "POST",
    body: JSON.stringify({
      displayName: input.displayName,
      gender: input.gender,
      positions: input.positions.map(positionToDbPosition),
      primaryPosition: positionToDbPosition(input.primaryPosition),
      avatar: input.avatar,
      tempUnavailableReason: input.tempUnavailableReason,
      tempUnavailableNote: input.tempUnavailableNote ?? null,
    }),
  });

  return mapApiProfile(body.player);
}

export async function fetchPlayer(playerId: string): Promise<Player> {
  const body = await requestJson<{ player: ApiProfile }>(`/api/players/${encodeURIComponent(playerId)}`);
  return mapApiProfile(body.player);
}

export async function updatePlayer(playerId: string, input: UpdateProfileInput): Promise<Player> {
  const body = await requestJson<{ player: ApiProfile }>(`/api/players/${encodeURIComponent(playerId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      displayName: input.displayName,
      gender: input.gender,
      positions: input.positions.map(positionToDbPosition),
      primaryPosition: positionToDbPosition(input.primaryPosition),
      avatar: input.avatar,
      tempUnavailableReason: input.tempUnavailableReason,
      tempUnavailableNote: input.tempUnavailableNote ?? null,
    }),
  });
  return mapApiProfile(body.player);
}

export async function deletePlayer(playerId: string): Promise<void> {
  await requestJson(`/api/players/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? `request_failed_${response.status}`);
  }

  return (await response.json()) as T;
}

function mapApiProfile(profile: ApiProfile): Player {
  const positions = profile.positions.map((position) => dbPositionToPosition(position.position));
  const primaryPosition = profile.positions.find((position) => position.isPrimary);

  return {
    id: profile.id,
    name: profile.displayName,
    gender: profile.gender as Gender,
    positions,
    primaryPosition: primaryPosition ? dbPositionToPosition(primaryPosition.position) : positions[0],
    avatar: profile.avatar,
    tempUnavailableReason: profile.tempUnavailableReason ?? null,
    tempUnavailableNote: profile.tempUnavailableNote ?? undefined,
  };
}
