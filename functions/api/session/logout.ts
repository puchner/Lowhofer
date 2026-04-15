import { CloudflareEnv } from "../../_shared/env";
import { jsonResponse } from "../../_shared/http";
import { createExpiredSessionCookie } from "../../_shared/session";

export const onRequestPost: PagesFunction<CloudflareEnv> = ({ request }) => {
  const headers = new Headers();
  headers.append("set-cookie", createExpiredSessionCookie(request));

  return jsonResponse({ isAuthenticated: false }, { headers });
};
