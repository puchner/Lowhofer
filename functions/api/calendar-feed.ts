import { requireSelectedPlayer } from "../_shared/auth";
import { CloudflareEnv } from "../_shared/env";
import { jsonResponse } from "../_shared/http";

export const onRequestGet: PagesFunction<CloudflareEnv> = async ({ request, env }) => {
  const authenticated = await requireSelectedPlayer(request, env);

  if (authenticated instanceof Response) {
    return authenticated;
  }

  const url = new URL(request.url);
  const feedUrl = new URL("/api/calendar.ics", url);

  if (env.CALENDAR_FEED_TOKEN) {
    feedUrl.searchParams.set("token", env.CALENDAR_FEED_TOKEN);
  }

  return jsonResponse({ url: feedUrl.toString() });
};
