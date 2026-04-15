import { PropsWithChildren, useEffect, useState } from "react";
import { listLeagueFixtures, listMatchDays, listPlayers } from "../data/matchDayRepository";
import { AvailabilityStatus, MatchDay } from "../domain/types";
import { CreatePollInput, PlannerContext, UpdateAvailabilityInput, UpdatePollInput } from "./plannerStore";

const MATCH_DAYS_STORAGE_KEY = "lowhofer.matchDays";

export function PlannerProvider({ children }: PropsWithChildren) {
  const players = listPlayers();
  const leagueFixtures = listLeagueFixtures();
  const [matchDays, setMatchDays] = useState<MatchDay[]>(loadInitialMatchDays);

  useEffect(() => {
    window.localStorage.setItem(MATCH_DAYS_STORAGE_KEY, JSON.stringify(matchDays));
  }, [matchDays]);

  function updateAvailability({ matchDayId, playerId, status }: UpdateAvailabilityInput) {
    // TODO: Hier später API-Update statt lokalem State ausführen.
    setMatchDays((currentMatchDays) =>
      currentMatchDays.map((matchDay) => {
        if (matchDay.id !== matchDayId) {
          return matchDay;
        }

        return {
          ...matchDay,
          availability: matchDay.availability.map((availability) =>
            availability.playerId === playerId ? { ...availability, status } : availability,
          ),
        };
      }),
    );
  }

  function createPoll(input: CreatePollInput): MatchDay {
    const newPoll: MatchDay = {
      ...input,
      id: crypto.randomUUID(),
      status: "open",
      availability: players.map((player) => ({
        matchDayId: "",
        playerId: player.id,
        status: AvailabilityStatus.Unknown,
      })),
    };

    newPoll.availability = newPoll.availability.map((availability) => ({
      ...availability,
      matchDayId: newPoll.id,
    }));

    setMatchDays((currentMatchDays) =>
      [...currentMatchDays, newPoll].sort((a, b) => a.date.localeCompare(b.date)),
    );

    return newPoll;
  }

  function updatePoll({ pollId, status, type }: UpdatePollInput) {
    // TODO: Hier später API-Update statt lokalem State ausführen.
    setMatchDays((currentMatchDays) =>
      currentMatchDays.map((matchDay) =>
        matchDay.id === pollId
          ? {
              ...matchDay,
              status: status ?? matchDay.status,
              type: type ?? matchDay.type,
            }
          : matchDay,
      ),
    );
  }

  function deletePoll(pollId: string) {
    // TODO: Hier später API-Delete oder Archivierung statt lokalem State ausführen.
    setMatchDays((currentMatchDays) => currentMatchDays.filter((matchDay) => matchDay.id !== pollId));
  }

  // TODO: Hier später echte Auth berücksichtigen und Daten per Query laden.
  return (
    <PlannerContext.Provider
      value={{ createPoll, deletePoll, leagueFixtures, players, matchDays, updateAvailability, updatePoll }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

function loadInitialMatchDays(): MatchDay[] {
  const fallbackMatchDays = listMatchDays();
  const storedValue = window.localStorage.getItem(MATCH_DAYS_STORAGE_KEY);

  if (!storedValue) {
    return fallbackMatchDays;
  }

  try {
    return mergeStoredAvailability(fallbackMatchDays, JSON.parse(storedValue) as MatchDay[]);
  } catch {
    return fallbackMatchDays;
  }
}

function mergeStoredAvailability(fallbackMatchDays: MatchDay[], storedMatchDays: MatchDay[]): MatchDay[] {
  const mergedFallbackMatchDays = fallbackMatchDays.map((matchDay) => {
    const storedMatchDay = storedMatchDays.find((stored) => stored.id === matchDay.id);

    if (!storedMatchDay) {
      return matchDay;
    }

    return {
      ...matchDay,
      availability: matchDay.availability.map((availability) => {
        const storedAvailability = storedMatchDay.availability.find(
          (stored) => stored.playerId === availability.playerId,
        );

        return storedAvailability ? { ...availability, status: storedAvailability.status } : availability;
      }),
    };
  });
  const customStoredMatchDays = storedMatchDays.filter(
    (stored) => !fallbackMatchDays.some((matchDay) => matchDay.id === stored.id),
  );

  return [...mergedFallbackMatchDays, ...customStoredMatchDays].sort((a, b) => a.date.localeCompare(b.date));
}
