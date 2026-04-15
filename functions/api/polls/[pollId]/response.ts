import { requireSelectedPlayer } from "../../../_shared/auth";
import { CloudflareEnv } from "../../../_shared/env";
import { jsonResponse, readJsonBody } from "../../../_shared/http";
import { buildResponseUpsert, ResponseRequestBody } from "../../../_shared/pollMapping";
import { getPoll, listResponsesForPoll, upsertResponse } from "../../../_shared/supabase";
import { dbStatusToAvailabilityStatus } from "../../../../src/data/supabaseMappers";

export const onRequestPut: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const pollId = getPollId(params.pollId);
  const poll = await getPoll(env, pollId);

  if (!poll) {
    return jsonResponse({ error: "poll_not_found" }, { status: 404 });
  }

  const body = await readJsonBody<ResponseRequestBody>(request);

  if (!body) {
    return jsonResponse({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const response = await upsertResponse(
      env,
      buildResponseUpsert(pollId, authenticated.selectedPlayerId, body),
    );

    return jsonResponse({
      response: {
        matchDayId: response.poll_id,
        playerId: response.player_id,
        status: dbStatusToAvailabilityStatus(response.status),
        comment: response.comment ?? undefined,
      },
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "response_update_failed" }, { status: 400 });
  }
};

export const onRequestGet: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const responses = await listResponsesForPoll(env, getPollId(params.pollId));
  const response = responses.find((item) => item.player_id === authenticated.selectedPlayerId);

  if (!response) {
    return jsonResponse({ error: "response_not_found" }, { status: 404 });
  }

  return jsonResponse({
    response: {
      matchDayId: response.poll_id,
      playerId: response.player_id,
      status: dbStatusToAvailabilityStatus(response.status),
      comment: response.comment ?? undefined,
    },
  });
};

function getPollId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
