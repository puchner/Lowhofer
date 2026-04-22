import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import {
  createPoll as createPollApi,
  deletePoll as deletePollApi,
  fetchLeagueFixtures,
  fetchPlayers,
  fetchPolls,
  updateAvailability as updateAvailabilityApi,
  updatePoll as updatePollApi,
} from "../api/plannerApi";
import { LeagueFixture, MatchDay, Player } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { CreatePollInput, PlannerContext, UpdateAvailabilityInput, UpdatePollInput } from "./plannerStore";

export function PlannerProvider({ children }: PropsWithChildren) {
  const session = useSession();
  const [leagueFixtures, setLeagueFixtures] = useState<LeagueFixture[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session.isAuthenticated || !session.selectedPlayerId) {
      setPlayers([]);
      setMatchDays([]);
      setLeagueFixtures([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextPlayers, nextMatchDays] = await Promise.all([fetchPlayers(), fetchPolls()]);
      setPlayers(nextPlayers);
      setMatchDays(sortMatchDays(nextMatchDays));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Daten konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }

    // Fixtures separat laden – ein Fehler hier soll Spieltage nicht blockieren
    fetchLeagueFixtures()
      .then(setLeagueFixtures)
      .catch(() => setLeagueFixtures([]));
  }, [session.isAuthenticated, session.selectedPlayerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function updateAvailability({ comment, matchDayId, status }: UpdateAvailabilityInput) {
    const response = await updateAvailabilityApi(matchDayId, status, comment);

    setMatchDays((currentMatchDays) =>
      currentMatchDays.map((matchDay) => {
        if (matchDay.id !== matchDayId) {
          return matchDay;
        }

        const existingResponse = matchDay.availability.some(
          (availability) => availability.playerId === response.playerId,
        );

        return {
          ...matchDay,
          availability: existingResponse
            ? matchDay.availability.map((availability) =>
                availability.playerId === response.playerId ? response : availability,
              )
            : [...matchDay.availability, response],
        };
      }),
    );
  }

  async function createPoll(input: CreatePollInput): Promise<MatchDay[]> {
    const newPolls = await createPollApi(input);

    setMatchDays((currentMatchDays) => sortMatchDays([...currentMatchDays, ...newPolls]));

    return newPolls;
  }

  async function updatePoll(input: UpdatePollInput) {
    const updatedPoll = await updatePollApi(input);

    if (input.finalizePlannedAppointment) {
      await refresh();
      return;
    }

    setMatchDays((currentMatchDays) =>
      sortMatchDays(currentMatchDays.map((matchDay) => (matchDay.id === updatedPoll.id ? updatedPoll : matchDay))),
    );
  }

  async function deletePoll(pollId: string) {
    await deletePollApi(pollId);
    setMatchDays((currentMatchDays) => currentMatchDays.filter((matchDay) => matchDay.id !== pollId));
  }

  return (
    <PlannerContext.Provider
      value={{
        createPoll,
        deletePoll,
        error,
        isLoading,
        leagueFixtures,
        matchDays,
        players,
        refresh,
        updateAvailability,
        updatePoll,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

function sortMatchDays(matchDays: MatchDay[]): MatchDay[] {
  return [...matchDays].sort((a, b) => a.date.localeCompare(b.date));
}
