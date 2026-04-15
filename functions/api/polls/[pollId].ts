import { requireAdmin, requireSelectedPlayer } from "../../_shared/auth";
import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse, readJsonBody } from "../../_shared/http";
import { buildPollPatch, mapPoll, PollRequestBody } from "../../_shared/pollMapping";
import { deletePoll, getPoll, listResponsesForPoll, updatePoll } from "../../_shared/supabase";

export const onRequestGet: PagesFunction<CloudflareEnv, "pollId"> = async ({ request, env, params }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const pollId = getPollId(params.pollId);
  const poll = await getPoll(env, pollId);

  if (!poll) {
    return jsonResponse({ error: "poll_not_found" }, { status: 404 });
  }

  const responses = await listResponsesForPoll(env, poll.id);

  return jsonResponse({ poll: mapPoll(poll, responses) });
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
    const patch = buildPollPatch(body);
    const poll = await updatePoll(env, getPollId(params.pollId), patch);

    if (!poll) {
      return jsonResponse({ error: "poll_not_found" }, { status: 404 });
    }

    const responses = await listResponsesForPoll(env, poll.id);

    return jsonResponse({ poll: mapPoll(poll, responses) });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "poll_update_failed" }, { status: 400 });
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

function getPollId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
