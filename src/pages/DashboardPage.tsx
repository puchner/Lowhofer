import { useState } from "react";
import { Link } from "react-router-dom";
import { MatchDayCard } from "../components/matchDays/MatchDayCard";
import { AvailabilityButtons } from "../components/ui/AvailabilityButtons";
import { getAllUpcomingMatchDays, getUpcomingMatchDays } from "../domain/matchDayFilters";
import { AvailabilityStatus } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

interface DashboardPageProps {
  isAdmin?: boolean;
}

export function DashboardPage({ isAdmin = false }: DashboardPageProps) {
  const { deletePoll, matchDays, players, updateAvailability, updatePoll } = usePlanner();
  const session = useSession();
  const [showAllMatchDays, setShowAllMatchDays] = useState(false);
  const activePlayerId = session.selectedPlayerId;
  const canAdmin = isAdmin && session.selectedPlayerIsAdmin;
  const allUpcomingMatchDays = getAllUpcomingMatchDays(matchDays);
  const upcomingMatchDays = showAllMatchDays ? allUpcomingMatchDays : getUpcomingMatchDays(matchDays);
  const hasMoreMatchDays = allUpcomingMatchDays.length > upcomingMatchDays.length;

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Kommende Spieltage</h2>
          {canAdmin ? (
            <Link className="btn btn-secondary min-h-11 rounded-lg text-petrol-900" to="/admin/polls/new">
              + Abstimmung
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3">
        {upcomingMatchDays.map((matchDay) => {
          const availability =
            activePlayerId === null
              ? AvailabilityStatus.Unknown
              : matchDay.availability.find((entry) => entry.playerId === activePlayerId)?.status ??
                AvailabilityStatus.Unknown;
          const cardAction =
            activePlayerId || canAdmin ? (
              <>
                {activePlayerId ? (
                  <AvailabilityButtons
                    onChange={(status) =>
                      updateAvailability({
                        matchDayId: matchDay.id,
                        playerId: activePlayerId,
                        status,
                      })
                    }
                    value={availability}
                  />
                ) : null}
                {canAdmin ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      className="btn btn-sm rounded-lg bg-base-300"
                      onClick={() => updatePoll({ pollId: matchDay.id, status: "archived" })}
                      type="button"
                    >
                      Archiv
                    </button>
                    <button
                      className="btn btn-sm btn-error rounded-lg"
                      onClick={() => deletePoll(matchDay.id)}
                      type="button"
                    >
                      Löschen
                    </button>
                  </div>
                ) : null}
              </>
            ) : undefined;

          return (
            <MatchDayCard
              action={cardAction}
              detailPath={canAdmin ? `/admin/match-days/${matchDay.id}` : `/match-days/${matchDay.id}`}
              key={matchDay.id}
              matchDay={matchDay}
              players={players}
            />
          );
        })}
      </div>

      {hasMoreMatchDays ? (
        <button
          className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900 sm:w-auto"
          onClick={() => setShowAllMatchDays(true)}
        >
          Weitere laden
        </button>
      ) : null}
    </section>
  );
}
