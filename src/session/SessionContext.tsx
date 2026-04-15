import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { Gender, Player, Position } from "../domain/types";
import { SessionContextValue, SessionState } from "./sessionTypes";
import { SessionContext } from "./sessionStore";

interface ApiPlayer {
  id: string;
  displayName: string;
  gender: Gender;
  isAdmin: boolean;
  positions: Array<{
    position: "setter" | "outside" | "middle" | "opposite" | "libero";
    isPrimary: boolean;
  }>;
}

const LAST_PLAYER_STORAGE_KEY = "lowhofer.lastSelectedPlayerId";

const emptySession: SessionState = {
  isAuthenticated: false,
  selectedPlayerId: null,
  selectedPlayerDisplayName: null,
  selectedPlayerIsAdmin: false,
};

const positionByApiValue: Record<ApiPlayer["positions"][number]["position"], Position> = {
  setter: Position.Setter,
  outside: Position.Outside,
  middle: Position.Middle,
  opposite: Position.Opposite,
  libero: Position.Libero,
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

      if (nextSession.isAuthenticated) {
        setPlayers(await fetchPlayers());
      } else {
        setPlayers([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (password: string) => {
    await postJson("/api/session/login", { password });
    const nextSession = await fetchSession();
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
    setPlayers([]);
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

async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch("/api/players");

  if (!response.ok) {
    throw new Error("Spielerliste konnte nicht geladen werden.");
  }

  const body = (await response.json()) as { players: ApiPlayer[] };

  return body.players.map(mapApiPlayer);
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

function mapApiPlayer(player: ApiPlayer): Player {
  const positions = player.positions.map((position) => positionByApiValue[position.position]);
  const primaryPosition = player.positions.find((position) => position.isPrimary);

  return {
    id: player.id,
    name: player.displayName,
    gender: player.gender,
    positions,
    primaryPosition: primaryPosition ? positionByApiValue[primaryPosition.position] : positions[0],
  };
}
