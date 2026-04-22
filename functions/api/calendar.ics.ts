import { buildCalendarIcs } from "../_shared/calendarIcs";
import { CloudflareEnv } from "../_shared/env";
import {
  listActiveLoginAccounts,
  listPollsForAppointment,
  listResponsesForPoll,
  listScheduledCalendarAppointments,
} from "../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const configuredToken = env.CALENDAR_FEED_TOKEN;

  if (configuredToken) {
    const token = new URL(request.url).searchParams.get("token");

    if (token !== configuredToken) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const [appointments, players] = await Promise.all([listScheduledCalendarAppointments(env), listActiveLoginAccounts(env)]);
  const playerNamesById = new Map(players.map((player) => [player.id, player.display_name]));
  const entries = await Promise.all(
    appointments.map(async (appointment) => {
      const polls = await listPollsForAppointment(env, appointment.id);
      const participants = new Set<string>();

      for (const poll of polls) {
        const responses = await listResponsesForPoll(env, poll.id);

        for (const response of responses) {
          if (response.status === "available") {
            const name = playerNamesById.get(response.player_id);

            if (name) {
              participants.add(name);
            }
          }
        }
      }

      return {
        appointment,
        participants: [...participants].sort((left, right) => left.localeCompare(right, "de")),
      };
    }),
  );
  const body = buildCalendarIcs(entries);

  return new Response(body, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/calendar; charset=utf-8",
    },
  });
};
