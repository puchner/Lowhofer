import {
  berlinDateTimeToIso,
  DbAvailabilityPollRow,
  DbAvailabilityResponseRow,
  DbHomeAway,
  DbPollStatus,
  DbPollType,
  dbStatusToAvailabilityStatus,
} from "../../src/data/supabaseMappers";

export interface ApiAvailabilityResponse {
  matchDayId: string;
  playerId: string;
  status: string;
  comment?: string;
}

export interface ApiPoll {
  id: string;
  title: string;
  type: DbPollType;
  status: DbPollStatus;
  date: string;
  time?: string;
  opponent: string;
  homeAway: DbHomeAway;
  location?: string;
  sourceFixtureId?: string;
  availability: ApiAvailabilityResponse[];
}

export interface PollRequestBody {
  title?: string;
  type?: DbPollType;
  status?: DbPollStatus;
  date?: string;
  time?: string;
  opponent?: string;
  homeAway?: DbHomeAway;
  location?: string;
  sourceFixtureId?: string;
}

export interface ResponseRequestBody {
  status?: "available" | "unavailable" | "maybe" | "unknown" | "zugesagt" | "abgesagt" | "unsicher" | "keine Rückmeldung";
  comment?: string;
}

export function mapPoll(row: DbAvailabilityPollRow, responses: DbAvailabilityResponseRow[]): ApiPoll {
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
    availability: responses
      .filter((response) => response.poll_id === row.id)
      .map((response) => ({
        matchDayId: response.poll_id,
        playerId: response.player_id,
        status: dbStatusToAvailabilityStatus(response.status),
        comment: response.comment ?? undefined,
      })),
  };
}

export function buildPollInsert(body: PollRequestBody, createdByPlayerId: string): Record<string, unknown> {
  const title = normalizeRequiredText(body.title, "title");
  const type = normalizePollType(body.type);
  const date = normalizeRequiredText(body.date, "date");
  const opponent = normalizeRequiredText(body.opponent, "opponent");
  const homeAway = normalizeHomeAway(body.homeAway);
  const startsAt = berlinDateTimeToIso(date, body.time || undefined);

  return {
    title,
    poll_type: type,
    poll_status: "open",
    starts_at: startsAt,
    location: normalizeOptionalText(body.location),
    home_away: homeAway,
    opponent_name: opponent,
    source_type: body.sourceFixtureId ? "league" : "custom",
    league_fixture_external_id: normalizeOptionalText(body.sourceFixtureId),
    created_by_player_id: createdByPlayerId,
  };
}

export function buildPollPatch(body: PollRequestBody): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    patch.title = normalizeRequiredText(body.title, "title");
  }

  if (body.type !== undefined) {
    patch.poll_type = normalizePollType(body.type);
  }

  if (body.status !== undefined) {
    patch.poll_status = normalizePollStatus(body.status);
    patch.archived_at = body.status === "archived" ? new Date().toISOString() : null;
  }

  if (body.date !== undefined || body.time !== undefined) {
    patch.starts_at = berlinDateTimeToIso(normalizeRequiredText(body.date, "date"), body.time || undefined);
  }

  if (body.opponent !== undefined) {
    patch.opponent_name = normalizeRequiredText(body.opponent, "opponent");
  }

  if (body.homeAway !== undefined) {
    patch.home_away = normalizeHomeAway(body.homeAway);
  }

  if (body.location !== undefined) {
    patch.location = normalizeOptionalText(body.location);
  }

  if (body.sourceFixtureId !== undefined) {
    patch.source_type = body.sourceFixtureId ? "league" : "custom";
    patch.league_fixture_external_id = normalizeOptionalText(body.sourceFixtureId);
  }

  return patch;
}

export function buildResponseUpsert(
  pollId: string,
  playerId: string,
  body: ResponseRequestBody,
): Record<string, unknown> {
  return {
    poll_id: pollId,
    player_id: playerId,
    status: normalizeResponseStatus(body.status),
    comment: normalizeOptionalText(body.comment),
    updated_at: new Date().toISOString(),
  };
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`${fieldName}_required`);
  }

  return text;
}

function normalizeOptionalText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function normalizePollType(value: unknown): DbPollType {
  if (value === "match" || value === "date-finding") {
    return value;
  }

  throw new Error("poll_type_invalid");
}

function normalizePollStatus(value: unknown): DbPollStatus {
  if (value === "open" || value === "archived" || value === "cancelled") {
    return value;
  }

  throw new Error("poll_status_invalid");
}

function normalizeHomeAway(value: unknown): DbHomeAway {
  if (value === "home" || value === "away" || value === "unknown") {
    return value;
  }

  throw new Error("home_away_invalid");
}

function normalizeResponseStatus(value: ResponseRequestBody["status"]): "available" | "unavailable" | "maybe" | "unknown" {
  if (value === "available" || value === "unavailable" || value === "maybe" || value === "unknown") {
    return value;
  }

  if (value) {
    if (value === "zugesagt") {
      return "available";
    }

    if (value === "abgesagt") {
      return "unavailable";
    }

    if (value === "unsicher") {
      return "maybe";
    }

    if (value === "keine Rückmeldung") {
      return "unknown";
    }
  }

  throw new Error("response_status_invalid");
}

function splitIsoInBerlin(isoValue: string): { date: string; time?: string } {
  const parts = getZonedParts(new Date(isoValue));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;

  return {
    date,
    time: time === "00:00" ? undefined : time,
  };
}

function getZonedParts(date: Date): Record<"year" | "month" | "day" | "hour" | "minute", string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);

  return {
    year: getPart(parts, "year"),
    month: getPart(parts, "month"),
    day: getPart(parts, "day"),
    hour: getPart(parts, "hour"),
    minute: getPart(parts, "minute"),
  };
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`date_${type}_missing`);
  }

  return value;
}
