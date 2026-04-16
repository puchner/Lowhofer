import { LeagueStanding } from "../domain/leagueTypes";
import { AvailabilityStatus, LeagueFixture, MatchAvailability, MatchDay, Player, Position } from "../domain/types";
import type { CreatePollInput, UpdatePollInput } from "../state/plannerStore";

interface ApiPlayer {
  id: string;
  displayName: string;
  role?: Player["role"];
  gender: Player["gender"];
  isAdmin: boolean;
  avatar?: {
    kind: "generated" | "uploaded";
    style?: string;
    seed?: string;
    url?: string;
  };
  positions: Array<{
    position: "setter" | "outside" | "middle" | "opposite" | "libero";
    isPrimary: boolean;
  }>;
}

const positionByApiValue: Record<ApiPlayer["positions"][number]["position"], Position> = {
  setter: Position.Setter,
  outside: Position.Outside,
  middle: Position.Middle,
  opposite: Position.Opposite,
  libero: Position.Libero,
};

export async function fetchPlayers(options: { scope?: "login" | "team" } = {}): Promise<Player[]> {
  const query = options.scope === "login" ? "?scope=login" : "";
  const body = await requestJson<{ players: ApiPlayer[] }>(`/api/players${query}`);

  return body.players.map(mapApiPlayer);
}

export async function fetchPolls(): Promise<MatchDay[]> {
  const body = await requestJson<{ polls: MatchDay[] }>("/api/polls");

  return body.polls;
}

export async function createPoll(input: CreatePollInput): Promise<MatchDay> {
  const body = await requestJson<{ poll: MatchDay }>("/api/polls", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return body.poll;
}

export async function updatePoll(input: UpdatePollInput): Promise<MatchDay> {
  const { pollId, ...patch } = input;
  const body = await requestJson<{ poll: MatchDay }>(`/api/polls/${encodeURIComponent(pollId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

  return body.poll;
}

export async function deletePoll(pollId: string): Promise<void> {
  await requestJson(`/api/polls/${encodeURIComponent(pollId)}`, {
    method: "DELETE",
  });
}

export async function updateAvailability(
  matchDayId: string,
  status: AvailabilityStatus,
  comment?: string | null,
): Promise<MatchAvailability> {
  const body = await requestJson<{ response: MatchAvailability }>(
    `/api/polls/${encodeURIComponent(matchDayId)}/response`,
    {
      method: "PUT",
      body: JSON.stringify({ comment, status }),
    },
  );

  return body.response;
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

export interface LeagueTableResult {
  standings: LeagueStanding[];
  lastChange: string;
  fetchedAt: string;
  expiresAt: string | null;
  isStale: boolean;
}

export interface LeagueSourceSettings {
  leagueBaseUrl: string | null;
  leagueTableUrl: string | null;
  leagueFixturesUrl: string | null;
}

export async function fetchLeagueTable(): Promise<LeagueTableResult> {
  return requestJson<LeagueTableResult>("/api/league/table");
}

export async function fetchLeagueFixtures(): Promise<LeagueFixture[]> {
  const body = await requestJson<{ fixtures: LeagueFixture[] }>("/api/league/fixtures");

  return body.fixtures;
}

export async function fetchLeagueSource(): Promise<LeagueSourceSettings> {
  return requestJson<LeagueSourceSettings>("/api/team-settings/league-source");
}

export async function updateLeagueSource(leagueBaseUrl: string): Promise<LeagueSourceSettings> {
  return requestJson<LeagueSourceSettings>("/api/team-settings/league-source", {
    method: "PATCH",
    body: JSON.stringify({ leagueBaseUrl }),
  });
}

function mapApiPlayer(player: ApiPlayer): Player {
  const positions = player.positions.map((position) => positionByApiValue[position.position]);
  const primaryPosition = player.positions.find((position) => position.isPrimary);

  return {
    id: player.id,
    name: player.displayName,
    role: player.role ?? "member",
    gender: player.gender,
    positions,
    primaryPosition: primaryPosition ? positionByApiValue[primaryPosition.position] : positions[0],
    avatar: player.avatar,
  };
}
