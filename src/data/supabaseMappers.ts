import { AvailabilityPoll, AvailabilityStatus, Gender, MatchAvailability, Player, Position } from "../domain/types";
export { berlinDateTimeToIso } from "../domain/berlinDateTime";

export type DbGender = "male" | "female" | "diverse";
export type DbPosition = "setter" | "outside" | "middle" | "opposite" | "libero";
export type DbAvailabilityStatus = "available" | "unavailable" | "maybe" | "unknown";
export type DbPollType = "match" | "date-finding";
export type DbPollStatus = "open" | "archived" | "cancelled";
export type DbMatchAppointmentStatus = "planned" | "scheduled" | "cancelled";
export type DbHomeAway = "home" | "away" | "unknown";
export type DbPlayerRole = "member" | "training_member";
export type DbSourceType = "custom" | "league";

export interface DbPlayerRow {
  id: string;
  display_name: string;
  gender: DbGender;
  is_active: boolean;
  is_admin: boolean;
  role?: DbPlayerRole;
  sort_order: number;
  avatar_kind?: "generated" | "uploaded";
  avatar_style?: string | null;
  avatar_seed?: string | null;
  avatar_storage_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlayerPositionRow {
  id: string;
  player_id: string;
  position: DbPosition;
  is_primary: boolean;
}

export interface DbAvailabilityPollRow {
  id: string;
  title: string;
  poll_type: DbPollType;
  poll_status: DbPollStatus;
  notes: string | null;
  match_appointment_id: string;
  created_by_player_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMatchRow {
  id: string;
  source_type: DbSourceType;
  league_game_nr: string | null;
  season_key: string | null;
  team_key: string | null;
  opponent_name: string;
  home_away: DbHomeAway;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMatchAppointmentRow {
  id: string;
  match_id: string;
  starts_at: string | null;
  has_time: boolean;
  status: DbMatchAppointmentStatus;
  location: string | null;
  source_type: DbSourceType;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMatchAppointmentWithMatchRow extends DbMatchAppointmentRow {
  matches?: DbMatchRow | null;
}

export interface DbAvailabilityPollWithAppointmentRow extends DbAvailabilityPollRow {
  match_appointments?: DbMatchAppointmentWithMatchRow | null;
}

export interface DbAvailabilityResponseRow {
  id: string;
  poll_id: string;
  player_id: string;
  status: DbAvailabilityStatus;
  comment: string | null;
  updated_at: string;
}

export interface DbPlayerWithPositions extends DbPlayerRow {
  player_positions?: DbPlayerPositionRow[];
}

const dbPositionByDomainPosition: Record<Position, DbPosition> = {
  [Position.Setter]: "setter",
  [Position.Outside]: "outside",
  [Position.Middle]: "middle",
  [Position.Opposite]: "opposite",
  [Position.Libero]: "libero",
};

const domainPositionByDbPosition: Record<DbPosition, Position> = {
  setter: Position.Setter,
  outside: Position.Outside,
  middle: Position.Middle,
  opposite: Position.Opposite,
  libero: Position.Libero,
};

const dbStatusByDomainStatus: Record<AvailabilityStatus, DbAvailabilityStatus> = {
  [AvailabilityStatus.Available]: "available",
  [AvailabilityStatus.Unavailable]: "unavailable",
  [AvailabilityStatus.Maybe]: "maybe",
  [AvailabilityStatus.Unknown]: "unknown",
};

const domainStatusByDbStatus: Record<DbAvailabilityStatus, AvailabilityStatus> = {
  available: AvailabilityStatus.Available,
  unavailable: AvailabilityStatus.Unavailable,
  maybe: AvailabilityStatus.Maybe,
  unknown: AvailabilityStatus.Unknown,
};

export function positionToDbPosition(position: Position): DbPosition {
  return dbPositionByDomainPosition[position];
}

export function dbPositionToPosition(position: DbPosition): Position {
  return domainPositionByDbPosition[position];
}

export function availabilityStatusToDbStatus(status: AvailabilityStatus): DbAvailabilityStatus {
  return dbStatusByDomainStatus[status];
}

export function dbStatusToAvailabilityStatus(status: DbAvailabilityStatus): AvailabilityStatus {
  return domainStatusByDbStatus[status];
}

export function mapDbPlayerToPlayer(row: DbPlayerWithPositions): Player {
  const positions = (row.player_positions ?? []).map((positionRow) => dbPositionToPosition(positionRow.position));
  const primaryPosition = row.player_positions?.find((positionRow) => positionRow.is_primary);

  return {
    id: row.id,
    name: row.display_name,
    role: row.role ?? "member",
    gender: row.gender as Gender,
    positions,
    primaryPosition: primaryPosition ? dbPositionToPosition(primaryPosition.position) : positions[0],
    avatar: row.avatar_kind
      ? {
          kind: row.avatar_kind,
          style: row.avatar_style ?? undefined,
          seed: row.avatar_seed ?? undefined,
        }
      : undefined,
  };
}

export function mapDbResponseToMatchAvailability(row: DbAvailabilityResponseRow): MatchAvailability {
  return {
    matchDayId: row.poll_id,
    playerId: row.player_id,
    status: dbStatusToAvailabilityStatus(row.status),
    comment: row.comment ?? undefined,
  };
}

export function mapDbPollToAvailabilityPoll(
  row: DbAvailabilityPollRow,
  responses: DbAvailabilityResponseRow[] = [],
): AvailabilityPoll {
  return {
    id: row.id,
    title: row.title,
    type: row.poll_type,
    status: row.poll_status,
    date: "",
    time: undefined,
    opponent: "",
    homeAway: "unknown",
    location: undefined,
    sourceFixtureId: undefined,
    availability: responses.filter((response) => response.poll_id === row.id).map(mapDbResponseToMatchAvailability),
  };
}

export function availabilityPollToDbInsert(
  poll: AvailabilityPoll,
  matchAppointmentId: string,
): Omit<DbAvailabilityPollRow, "created_at" | "updated_at" | "archived_at" | "created_by_player_id" | "notes"> {
  return {
    id: poll.id,
    title: poll.title,
    poll_type: poll.type,
    poll_status: poll.status,
    match_appointment_id: matchAppointmentId,
  };
}

export function matchAvailabilityToDbUpsert(response: MatchAvailability): Pick<
  DbAvailabilityResponseRow,
  "poll_id" | "player_id" | "status" | "comment"
> {
  return {
    poll_id: response.matchDayId,
    player_id: response.playerId,
    status: availabilityStatusToDbStatus(response.status),
    comment: response.comment ?? null,
  };
}
