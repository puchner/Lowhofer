import { requireAdmin, requireSelectedPlayer } from "../_shared/auth";
import { CloudflareEnv } from "../_shared/env";
import { jsonResponse, readJsonBody } from "../_shared/http";
import { getLeagueContext } from "../_shared/leagueContext";
import { buildPollInsert, mapPollWithAppointment, PollRequestBody } from "../_shared/pollMapping";
import { berlinDateTimeToIso, getBerlinTime } from "../../src/domain/berlinDateTime";
import {
  createAppointment,
  createCustomMatch,
  createPollForAppointment,
  createResponses,
  getPollWithAppointment,
  listActivePlayers,
  listAppointmentsForMatch,
  listPollsForAppointment,
  listPollsWithAppointments,
  listResponses,
  upsertLeagueMatch,
} from "../_shared/supabase";
import { DbAvailabilityPollRow, DbMatchAppointmentRow, DbMatchAppointmentStatus } from "../../src/data/supabaseMappers";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const [polls, responses] = await Promise.all([listPollsWithAppointments(env), listResponses(env)]);

  return jsonResponse({
    polls: polls.map((poll) => mapPollWithAppointment(poll, responses)),
  });
};

export const onRequestPost: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireAdmin(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<PollRequestBody>(request);

  if (!body) {
    return jsonResponse({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const { seasonKey, teamKey } = await getLeagueContext(env);
    const pollInputs = buildPollDrafts(body, authenticated.selectedPlayerId);

    if (pollInputs.length === 0) {
      return jsonResponse({ error: "suggestions_required" }, { status: 400 });
    }

    const match = pollInputs[0].league_fixture_external_id
      ? await upsertLeagueMatch(env, {
          leagueGameNr: pollInputs[0].league_fixture_external_id,
          seasonKey,
          teamKey,
          opponentName: pollInputs[0].opponent_name,
          homeAway: pollInputs[0].home_away,
        })
      : await createCustomMatch(env, {
          opponentName: pollInputs[0].opponent_name,
          homeAway: pollInputs[0].home_away,
          teamKey,
        });
    const createdPolls: DbAvailabilityPollRow[] = [];
    const players = await listActivePlayers(env);

    for (const pollInsert of pollInputs) {
      const appointmentStatus = pollTypeToAppointmentStatus(pollInsert.poll_insert.poll_type);
      const appointment =
        pollInsert.league_fixture_external_id && appointmentStatus === "scheduled"
          ? await findOrCreateAppointment(env, {
              hasTime: Boolean(extractPollTime(body, pollInsert.starts_at)),
              location: pollInsert.location,
              matchId: match.id,
              sourceType: pollInsert.source_type,
              startsAt: pollInsert.starts_at,
              status: appointmentStatus,
            })
          : await createAppointment(env, {
              hasTime: Boolean(extractPollTime(body, pollInsert.starts_at)),
              location: pollInsert.location,
              matchId: match.id,
              sourceType: pollInsert.source_type,
              startsAt: pollInsert.starts_at,
              status: appointmentStatus,
            });
      const existingPolls = await listPollsForAppointment(env, appointment.id);

      if (existingPolls.length > 0 && pollInsert.league_fixture_external_id) {
        return jsonResponse({ error: "poll_already_exists_for_appointment" }, { status: 409 });
      }

      const poll = await createPollForAppointment(env, appointment.id, { ...pollInsert.poll_insert });

      await createResponses(
        env,
        players.map((player) => ({
          poll_id: poll.id,
          player_id: player.id,
          status: "unknown",
        })),
      );

      createdPolls.push(poll);
    }

    const [hydratedPolls, responses] = await Promise.all([
      Promise.all(createdPolls.map((poll) => getPollWithAppointment(env, poll.id))),
      listResponses(env),
    ]);

    return jsonResponse(
      {
        polls: hydratedPolls
          .filter((poll): poll is NonNullable<typeof poll> => Boolean(poll))
          .map((poll) => mapPollWithAppointment(poll, responses)),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "poll_create_failed" }, { status: 400 });
  }
};

interface PollInsert {
  title: string;
  poll_type: "match" | "date-finding";
  poll_status: "open";
  notes: null;
  created_by_player_id: string;
}

interface PollDraft {
  starts_at: string;
  location: string | null;
  home_away: "home" | "away" | "unknown";
  opponent_name: string;
  source_type: "custom" | "league";
  league_fixture_external_id: string | null;
  poll_insert: PollInsert;
}

interface AppointmentLookupInput {
  matchId: string;
  startsAt: string;
  hasTime: boolean;
  status: DbMatchAppointmentStatus;
  location: string | null;
  sourceType: "custom" | "league";
}

async function findOrCreateAppointment(
  env: CloudflareEnv,
  input: AppointmentLookupInput,
): Promise<DbMatchAppointmentRow> {
  const appointments = await listAppointmentsForMatch(env, input.matchId);
  const existingAppointment = appointments.find(
    (appointment) =>
      appointment.starts_at === input.startsAt &&
      appointment.status === input.status &&
      appointment.source_type === input.sourceType,
  );

  if (existingAppointment) {
    return existingAppointment;
  }

  return createAppointment(env, {
    hasTime: input.hasTime,
    location: input.location,
    matchId: input.matchId,
    sourceType: input.sourceType,
    startsAt: input.startsAt,
    status: input.status,
  });
}

export function pollTypeToAppointmentStatus(pollType: PollInsert["poll_type"]): DbMatchAppointmentStatus {
  return pollType === "date-finding" ? "planned" : "scheduled";
}

export function buildPollDrafts(body: PollRequestBody, createdByPlayerId: string): PollDraft[] {
  const suggestionInputs = body.suggestions ?? [];

  if (suggestionInputs.length > 0) {
    const requestedPollType =
      suggestionInputs.length > 1
        ? "date-finding"
        : body.type === "date-finding"
          ? "date-finding"
          : "match";
    const seenKeys = new Set<string>();

    return suggestionInputs.map((suggestion) => {
      const input = buildPollDraft(
        {
          ...body,
          type: requestedPollType,
          date: suggestion.date,
          location: suggestion.location ?? body.location,
          time: suggestion.time,
        },
        createdByPlayerId,
      );
      const dedupeKey = `${input.starts_at}|${input.location ?? ""}`;

      if (seenKeys.has(dedupeKey)) {
        throw new Error("duplicate_suggestion");
      }

      seenKeys.add(dedupeKey);

      return input;
    });
  }

  return [buildPollDraft({ ...body, type: body.type ?? "match" }, createdByPlayerId)];
}

function buildPollDraft(body: PollRequestBody, createdByPlayerId: string): PollDraft {
  const date = requireText(body.date, "date");

  return {
    starts_at: berlinDateTimeToIso(date, body.time || undefined),
    location: normalizeOptionalText(body.location),
    home_away: normalizeHomeAway(body.homeAway),
    opponent_name: requireText(body.opponent, "opponent"),
    source_type: body.sourceFixtureId ? "league" : "custom",
    league_fixture_external_id: normalizeOptionalText(body.sourceFixtureId),
    poll_insert: buildPollInsert(body, createdByPlayerId) as unknown as PollInsert,
  };
}

function extractPollTime(body: PollRequestBody, startsAt: string): string | undefined {
  if (body.time) {
    return body.time;
  }

  return getBerlinTime(startsAt);
}

function requireText(value: unknown, fieldName: string): string {
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

function normalizeHomeAway(value: unknown): "home" | "away" | "unknown" {
  if (value === "home" || value === "away" || value === "unknown") {
    return value;
  }

  throw new Error("home_away_invalid");
}
