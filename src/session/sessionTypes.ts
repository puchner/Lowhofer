import { Player } from "../domain/types";

export interface SessionState {
  isAuthenticated: boolean;
  selectedPlayerId: string | null;
  selectedPlayerDisplayName: string | null;
  selectedPlayerIsAdmin: boolean;
}

export interface SessionContextValue extends SessionState {
  isLoading: boolean;
  players: Player[];
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectPlayer: (playerId: string) => Promise<void>;
  refresh: () => Promise<void>;
}
