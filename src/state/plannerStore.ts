import { createContext, useContext } from "react";
import { AvailabilityStatus, LeagueFixture, MatchDay, Player, PollType } from "../domain/types";

export interface UpdateAvailabilityInput {
  matchDayId: string;
  playerId: string;
  status: AvailabilityStatus;
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
  type?: PollType;
  status?: "open" | "archived" | "cancelled";
}

export interface PlannerContextValue {
  players: Player[];
  matchDays: MatchDay[];
  leagueFixtures: LeagueFixture[];
  createPoll: (input: CreatePollInput) => MatchDay;
  deletePoll: (pollId: string) => void;
  updatePoll: (input: UpdatePollInput) => void;
  updateAvailability: (input: UpdateAvailabilityInput) => void;
}

export const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);

  if (!value) {
    throw new Error("usePlanner must be used within PlannerProvider");
  }

  return value;
}
