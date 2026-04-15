import { AvailabilityPoll, AvailabilityStatus, Gender, MatchAvailability, Player, Position } from "../domain/types";

export type DbGender = "male" | "female" | "diverse";
export type DbPosition = "setter" | "outside" | "middle" | "opposite" | "libero";
export type DbAvailabilityStatus = "available" | "unavailable" | "maybe" | "unknown";
export type DbPollType = "match" | "date-finding";
export type DbPollStatus = "open" | "archived" | "cancelled";
export type DbHomeAway = "home" | "away" | "unknown";

export interface DbPlayerRow {
  id: string;
  display_name: string;
  gender: DbGender;
  is_active: boolean;
  is_admin: boolean;
  sort_order: number;
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
  starts_at: string | null;
  location: string | null;
  home_away: DbHomeAway;
  opponent_name: string | null;
  notes: string | null;
  source_type: "custom" | "league";
  league_fixture_external_id: string | null;
  created_by_player_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
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

const APP_TIME_ZONE = "Europe/Berlin";

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
    gender: row.gender as Gender,
    positions,
    primaryPosition: primaryPosition ? dbPositionToPosition(primaryPosition.position) : positions[0],
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
  const startsAt = row.starts_at ? splitIsoInBerlin(row.starts_at) : { date: "", time: undefined };

  return {
    id: row.id,
    title: row.title,
    type: row.poll_type,
    status: row.poll_status,
    date: startsAt.date,
    time: startsAt.time,
    opponent: row.opponent_name ?? "",
    homeAway: row.home_away,
    location: row.location ?? undefined,
    sourceFixtureId: row.league_fixture_external_id ?? undefined,
    availability: responses.filter((response) => response.poll_id === row.id).map(mapDbResponseToMatchAvailability),
  };
}

export function availabilityPollToDbInsert(poll: AvailabilityPoll): Omit<
  DbAvailabilityPollRow,
  "created_at" | "updated_at" | "archived_at" | "created_by_player_id" | "notes"
> {
  return {
    id: poll.id,
    title: poll.title,
    poll_type: poll.type,
    poll_status: poll.status,
    starts_at: poll.date ? berlinDateTimeToIso(poll.date, poll.time) : null,
    location: poll.location ?? null,
    home_away: poll.homeAway,
    opponent_name: poll.opponent || null,
    source_type: poll.sourceFixtureId ? "league" : "custom",
    league_fixture_external_id: poll.sourceFixtureId ?? null,
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

export function berlinDateTimeToIso(date: string, time = "00:00"): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = localAsUtcMs;

  for (let index = 0; index < 2; index += 1) {
    utcMs = localAsUtcMs - getTimeZoneOffsetMs(new Date(utcMs), APP_TIME_ZONE);
  }

  return new Date(utcMs).toISOString();
}

function splitIsoInBerlin(isoValue: string): { date: string; time?: string } {
  const parts = getZonedParts(new Date(isoValue), APP_TIME_ZONE);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;

  return {
    date,
    time: time === "00:00" ? undefined : time,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const zonedAsUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return zonedAsUtcMs - date.getTime();
}

function getZonedParts(date: Date, timeZone: string): Record<"year" | "month" | "day" | "hour" | "minute" | "second", string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: getPart(parts, "year"),
    month: getPart(parts, "month"),
    day: getPart(parts, "day"),
    hour: getPart(parts, "hour"),
    minute: getPart(parts, "minute"),
    second: getPart(parts, "second"),
  };
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Could not read ${type} from ${APP_TIME_ZONE} date.`);
  }

  return value;
}
