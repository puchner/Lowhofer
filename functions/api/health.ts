import { CloudflareEnv, getServerConfigStatus } from "../_shared/env";

export const onRequestGet: PagesFunction<CloudflareEnv> = ({ env }) =>
  Response.json({
    ok: true,
    runtime: "cloudflare-pages-functions",
    configured: getServerConfigStatus(env),
  });
