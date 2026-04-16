import { apiUrl } from "./config";

export interface UpdateStateResponse {
  lastSeenUpdateAt: string;
}

export async function fetchUpdateState(): Promise<UpdateStateResponse | null> {
  const response = await fetch(apiUrl("/updates/state"));

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Update-Status konnte nicht geladen werden.");
  }

  return (await response.json()) as UpdateStateResponse;
}

export async function markUpdatesSeen(lastSeenUpdateAt: string): Promise<UpdateStateResponse | null> {
  const response = await fetch(apiUrl("/updates/state"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lastSeenUpdateAt }),
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Update-Status konnte nicht gespeichert werden.");
  }

  return (await response.json()) as UpdateStateResponse;
}
