import { requireAdmin, requireSelectedPlayer } from "../_shared/auth";
import { CloudflareEnv } from "../_shared/env";
import { jsonResponse, readJsonBody } from "../_shared/http";
import { buildPollInsert, mapPoll, PollRequestBody } from "../_shared/pollMapping";
import {
  createPoll,
  createResponses,
  listActivePlayers,
  listPolls,
  listResponses,
} from "../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const [polls, responses] = await Promise.all([listPolls(env), listResponses(env)]);

  return jsonResponse({
    polls: polls.map((poll) => mapPoll(poll, responses)),
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
    const poll = await createPoll(env, buildPollInsert(body, authenticated.selectedPlayerId));
    const players = await listActivePlayers(env);

    await createResponses(
      env,
      players.map((player) => ({
        poll_id: poll.id,
        player_id: player.id,
        status: "unknown",
      })),
    );

    const responses = await listResponses(env);

    return jsonResponse({ poll: mapPoll(poll, responses) }, { status: 201 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "poll_create_failed" }, { status: 400 });
  }
};
