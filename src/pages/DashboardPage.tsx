import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MatchDayCard } from "../components/matchDays/MatchDayCard";
import { AvailabilityButtons } from "../components/ui/AvailabilityButtons";
import { getAllUpcomingMatchDays, getUpcomingMatchDays } from "../domain/matchDayFilters";
import { AvailabilityStatus } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function DashboardPage() {
  const { deletePoll, error, isLoading, matchDays, players, updateAvailability } = usePlanner();
  const session = useSession();
  const [showAllMatchDays, setShowAllMatchDays] = useState(false);
  const activePlayerId = session.selectedPlayerId;
  const canAdmin = session.selectedPlayerIsAdmin;
  const allUpcomingMatchDays = getAllUpcomingMatchDays(matchDays);
  const upcomingMatchDays = showAllMatchDays ? allUpcomingMatchDays : getUpcomingMatchDays(matchDays);
  const hasMoreMatchDays = allUpcomingMatchDays.length > upcomingMatchDays.length;

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Termine</h2>
          {canAdmin ? (
            <Link className="btn btn-secondary min-h-11 rounded-lg text-petrol-900" to="/polls/new">
              + Abstimmung
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <section className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm font-semibold text-error">
          {error}
        </section>
      ) : null}

      {isLoading ? <p className="rounded-lg bg-base-100 p-4 text-base-content/70">Lade Spieltage...</p> : null}

      <div className="grid gap-3">
        {upcomingMatchDays.map((matchDay) => {
          const activeAvailability =
            activePlayerId === null
              ? undefined
              : matchDay.availability.find((entry) => entry.playerId === activePlayerId);
          const availability = activeAvailability?.status ?? AvailabilityStatus.Unknown;
          const cardAction =
            activePlayerId ? (
              <AvailabilityButtons
                comment={activeAvailability?.comment}
                onChange={(status, comment) =>
                  updateAvailability({
                    comment,
                    matchDayId: matchDay.id,
                    status,
                  })
                }
                value={availability}
              />
            ) : undefined;
          const headerAction = canAdmin ? (
            <>
              <Link
                aria-label="Abstimmung bearbeiten"
                className="btn h-7 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-xs leading-none text-base-content"
                title="Bearbeiten"
                to={`/polls/${matchDay.id}/edit`}
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
              <button
                aria-label="Abstimmung löschen"
                className="btn h-7 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-xs leading-none text-error hover:bg-error hover:text-white"
                onClick={() => void deletePoll(matchDay.id)}
                title="Löschen"
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </>
          ) : undefined;

          return (
            <MatchDayCard
              action={cardAction}
              detailPath={`/match-days/${matchDay.id}`}
              headerAction={headerAction}
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
