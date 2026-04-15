import { createContext, useContext } from "react";
import { AvailabilityStatus, LeagueFixture, MatchDay, Player, PollType } from "../domain/types";

export interface UpdateAvailabilityInput {
  matchDayId: string;
  status: AvailabilityStatus;
  comment?: string | null;
}

export interface CreatePollInput {
  title: string;
  type: PollType;
  date: string;
  time?: string;
  opponent: string;
  homeAway: "home" | "away" | "unknown";
  location?: string;
  sourceFixtureId?: string;
}

export interface UpdatePollInput {
  pollId: string;
  title?: string;
  type?: PollType;
  status?: "open" | "archived" | "cancelled";
  date?: string;
  time?: string;
  opponent?: string;
  homeAway?: "home" | "away" | "unknown";
  location?: string;
}

export interface PlannerContextValue {
  players: Player[];
  matchDays: MatchDay[];
  leagueFixtures: LeagueFixture[];
  isLoading: boolean;
  error: string | null;
  createPoll: (input: CreatePollInput) => Promise<MatchDay>;
  deletePoll: (pollId: string) => Promise<void>;
  refresh: () => Promise<void>;
  updatePoll: (input: UpdatePollInput) => Promise<void>;
  updateAvailability: (input: UpdateAvailabilityInput) => Promise<void>;
}

export const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);

  if (!value) {
    throw new Error("usePlanner must be used within PlannerProvider");
  }

  return value;
}
