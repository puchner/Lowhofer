import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { fetchPlayers } from "../api/plannerApi";
import { Player } from "../domain/types";
import { SessionContextValue, SessionState } from "./sessionTypes";
import { SessionContext } from "./sessionStore";

const LAST_PLAYER_STORAGE_KEY = "lowhofer.lastSelectedPlayerId";

const emptySession: SessionState = {
  isAuthenticated: false,
  selectedPlayerId: null,
  selectedPlayerDisplayName: null,
  selectedPlayerIsAdmin: false,
};

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState>(emptySession);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextSession = await fetchSession();
      setSession(nextSession);
      setPlayers(await fetchPlayers());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (password: string, playerId: string) => {
    const nextSession = await postJson<SessionState>("/api/session/login", { password, playerId });
    window.localStorage.setItem(LAST_PLAYER_STORAGE_KEY, playerId);
    setSession(nextSession);
    setPlayers(await fetchPlayers());
  }, []);

  const selectPlayer = useCallback(async (playerId: string) => {
    const nextSession = await postJson<SessionState>("/api/session/player", { playerId });
    window.localStorage.setItem(LAST_PLAYER_STORAGE_KEY, playerId);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    await postJson("/api/session/logout", {});
    window.localStorage.removeItem(LAST_PLAYER_STORAGE_KEY);
    setSession(emptySession);
    setPlayers(await fetchPlayers());
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      isLoading,
      players,
      login,
      logout,
      selectPlayer,
      refresh,
    }),
    [isLoading, login, logout, players, refresh, selectPlayer, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

async function fetchSession(): Promise<SessionState> {
  const response = await fetch("/api/session");

  if (!response.ok) {
    throw new Error("Session konnte nicht geladen werden.");
  }

  return (await response.json()) as SessionState;
}

async function postJson<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(errorBody?.error ?? "request_failed");
  }

  return (await response.json()) as T;
}
