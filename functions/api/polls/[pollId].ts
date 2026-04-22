import { requireAdmin, requireSelectedPlayer } from "../../_shared/auth";
import { buildAppointmentFinalizationPlan } from "../../_shared/appointmentFinalization";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { buildPollPatch, mapPollWithAppointment, PollRequestBody } from "../../_shared/pollMapping";
import {
  deleteAppointment,
  deletePoll,
  getPollWithAppointment,
  listAppointmentsForMatch,
  listPollsForAppointment,
  listResponsesForPoll,
  updateAppointment,
  updateMatch,
  updatePoll,
} from "../../_shared/supabase";
import { DbMatchAppointmentStatus, DbPollType } from "../../../src/data/supabaseMappers";

export const onRequestGet: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const pollId = getPollId(params.pollId);
  const poll = await getPollWithAppointment(env, pollId);

  if (!poll) {
    return jsonResponse({ error: "poll_not_found" }, { status: 404 });
  }

  const responses = await listResponsesForPoll(env, poll.id);

  return jsonResponse({ poll: mapPollWithAppointment(poll, responses) });
};

export const onRequestPatch: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireAdmin(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const body = await readJsonBody<PollRequestBody>(request);

  if (!body) {
    return jsonResponse({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const pollId = getPollId(params.pollId);
    const existingPoll = await getPollWithAppointment(env, pollId);

    if (!existingPoll) {
      return jsonResponse({ error: "poll_not_found" }, { status: 404 });
    }

    const patch = buildPollPatch(body);
    const appointment = existingPoll.match_appointments ?? null;
    const match = appointment?.matches ?? null;

    if (body.finalizePlannedAppointment) {
      if (!appointment || !match) {
        return jsonResponse({ error: "appointment_not_found" }, { status: 400 });
      }
      const appointments = await listAppointmentsForMatch(env, match.id);
      const finalizationPlan = buildAppointmentFinalizationPlan(appointments, appointment.id);

      await updateAppointment(env, finalizationPlan.winner.id, {
        status: "scheduled",
        cancelled_at: null,
      });

      await updatePoll(env, pollId, {
        poll_type: "match",
      });

      for (const siblingAppointment of finalizationPlan.siblingsToDelete) {
        const siblingPolls = await listPollsForAppointment(env, siblingAppointment.id);

        for (const siblingPoll of siblingPolls) {
          await deletePoll(env, siblingPoll.id);
        }

        await deleteAppointment(env, siblingAppointment.id);
      }
    }

    if (appointment) {
      const appointmentPatch = buildAppointmentPatch(
        body,
        patch,
        body.finalizePlannedAppointment ? "scheduled" : appointment.status,
        body.finalizePlannedAppointment ? "match" : existingPoll.poll_type,
      );

      if (Object.keys(appointmentPatch).length > 0) {
        await updateAppointment(env, appointment.id, appointmentPatch);
      }
    }

    if (match) {
      const matchPatch = buildMatchPatch(patch);

      if (Object.keys(matchPatch).length > 0) {
        await updateMatch(env, match.id, matchPatch);
      }
    }

    const poll = await updatePoll(env, pollId, patch);

    if (!poll) {
      return jsonResponse({ error: "poll_not_found" }, { status: 404 });
    }

    const [updatedPoll, responses] = await Promise.all([getPollWithAppointment(env, poll.id), listResponsesForPoll(env, poll.id)]);

    if (!updatedPoll) {
      return jsonResponse({ error: "poll_not_found_after_update" }, { status: 500 });
    }

    return jsonResponse({ poll: mapPollWithAppointment(updatedPoll, responses) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "poll_update_failed";

    return jsonResponse({ error: message }, { status: statusCodeForPollUpdateError(message) });
  }
};

export const onRequestDelete: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireAdmin(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  await deletePoll(env, getPollId(params.pollId));

  return jsonResponse({ ok: true });
};

function buildAppointmentPatch(
  body: PollRequestBody,
  legacyPollPatch: Record<string, unknown>,
  currentStatus: DbMatchAppointmentStatus,
  currentPollType: DbPollType,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (legacyPollPatch.starts_at !== undefined) {
    patch.starts_at = legacyPollPatch.starts_at;
    patch.has_time = Boolean(body.time);
  }

  if (legacyPollPatch.location !== undefined) {
    patch.location = legacyPollPatch.location;
  }

  if (body.type !== undefined && currentStatus !== "cancelled") {
    patch.status = body.type === "date-finding" ? "planned" : "scheduled";
    patch.cancelled_at = null;
  }

  if (body.status === "cancelled") {
    patch.status = "cancelled";
    patch.cancelled_at = new Date().toISOString();
  }

  if (body.status === "open" && currentStatus === "cancelled") {
    patch.status = appointmentStatusForPollType(body.type ?? currentPollType);
    patch.cancelled_at = null;
  }

  return patch;
}

function buildMatchPatch(legacyPollPatch: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (legacyPollPatch.opponent_name !== undefined) {
    patch.opponent_name = legacyPollPatch.opponent_name;
  }

  if (legacyPollPatch.home_away !== undefined) {
    patch.home_away = legacyPollPatch.home_away;
  }

  return patch;
}

function appointmentStatusForPollType(pollType: DbPollType): DbMatchAppointmentStatus {
  return pollType === "date-finding" ? "planned" : "scheduled";
}

function statusCodeForPollUpdateError(error: string): number {
  if (error === "appointment_not_found") {
    return 404;
  }

  if (error === "appointment_not_planned" || error === "scheduled_appointment_conflict") {
    return 409;
  }

  return 400;
}

function getPollId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
