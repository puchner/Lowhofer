export interface CloudflareEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SESSION_SECRET?: string;
  CALENDAR_FEED_TOKEN?: string;
  LOCAL_TEST_DATA?: string;
}

const requiredServerSecrets = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SESSION_SECRET"] as const;

export type RequiredServerSecret = (typeof requiredServerSecrets)[number];

export function getRequiredEnv(env: CloudflareEnv, key: RequiredServerSecret): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}

export function getServerConfigStatus(env: CloudflareEnv): Record<RequiredServerSecret, boolean> {
  return Object.fromEntries(requiredServerSecrets.map((key) => [key, Boolean(env[key])])) as Record<
    RequiredServerSecret,
    boolean
  >;
}

export function isLocalTestDataEnabled(env: CloudflareEnv): boolean {
  const value = env.LOCAL_TEST_DATA?.trim().toLowerCase();

  return value === "1" || value === "true" || value === "yes" || value === "on";
}
