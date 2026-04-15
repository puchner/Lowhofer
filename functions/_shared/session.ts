import { CloudflareEnv, getRequiredEnv } from "./env";

export interface SessionPayload {
  isAuthenticated: true;
  selectedPlayerId?: string;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = "lowhofer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function readSession(request: Request, env: CloudflareEnv): Promise<SessionPayload | null> {
  const cookieValue = getCookie(request, SESSION_COOKIE_NAME);

  if (!cookieValue) {
    return null;
  }

  const [payloadValue, signature] = cookieValue.split(".");

  if (!payloadValue || !signature) {
    return null;
  }

  const expectedSignature = await signValue(payloadValue, getRequiredEnv(env, "SESSION_SECRET"));

  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(payloadValue)) as Partial<SessionPayload>;

  if (!payload.isAuthenticated || !payload.expiresAt || payload.expiresAt <= Date.now()) {
    return null;
  }

  return {
    isAuthenticated: true,
    selectedPlayerId: payload.selectedPlayerId,
    expiresAt: payload.expiresAt,
  };
}

export async function createSessionCookie(
  request: Request,
  env: CloudflareEnv,
  selectedPlayerId?: string,
): Promise<string> {
  const payload: SessionPayload = {
    isAuthenticated: true,
    selectedPlayerId,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signValue(encodedPayload, getRequiredEnv(env, "SESSION_SECRET"));

  return serializeCookie(request, `${encodedPayload}.${signature}`, SESSION_TTL_SECONDS);
}

export function createExpiredSessionCookie(request: Request): string {
  return serializeCookie(request, "", 0);
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function serializeCookie(request: Request, value: string, maxAge: number): string {
  const isSecure = new URL(request.url).protocol === "https:";
  const securePart = isSecure ? "; Secure" : "";

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${securePart}`;
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

function base64UrlEncode(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(value: Uint8Array): string {
  let binary = "";

  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  return atob(base64);
}
