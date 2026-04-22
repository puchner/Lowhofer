import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MatchDayCard } from "../components/matchDays/MatchDayCard";
import { AvailabilityButtons } from "../components/ui/AvailabilityButtons";
import { groupMatchDays } from "../domain/matchDayGroups";
import { getAllUpcomingMatchDays, getUpcomingMatchDays } from "../domain/matchDayFilters";
import { isTrainingMemberRole } from "../domain/playerRoles";
import { AvailabilityStatus, MatchDay } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function DashboardPage() {
  const { deletePoll, error, isLoading, matchDays, players, updateAvailability, updatePoll } = usePlanner();
  const session = useSession();
  const [showAllMatchDays, setShowAllMatchDays] = useState(false);
  const activePlayerId = session.selectedPlayerId;
  const canAdmin = session.selectedPlayerIsAdmin;
  const canWriteAvailability = !isTrainingMemberRole(session.selectedPlayerRole ?? undefined);
  const allUpcomingMatchDays = getAllUpcomingMatchDays(matchDays);
  const upcomingMatchDays = showAllMatchDays ? allUpcomingMatchDays : getUpcomingMatchDays(matchDays);
  const groupedMatchDays = groupMatchDays(upcomingMatchDays);
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
        {groupedMatchDays.map((group) => {
          if (group.kind === "single") {
            const matchDay = group.matchDay;
            const activeAvailability =
              activePlayerId === null
                ? undefined
                : matchDay.availability.find((entry) => entry.playerId === activePlayerId);
            const availability = activeAvailability?.status ?? AvailabilityStatus.Unknown;
            const cardAction =
              activePlayerId && canWriteAvailability ? (
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
          }

          return (
            <section className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm" key={group.matchId}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-petrol-900">{group.label}</h3>
                  <p className="text-sm text-base-content/70">{group.matchDays.length} Terminvorschläge</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {group.matchDays.map((matchDay) => {
                  const activeAvailability =
                    activePlayerId === null
                      ? undefined
                      : matchDay.availability.find((entry) => entry.playerId === activePlayerId);
                  const availability = activeAvailability?.status ?? AvailabilityStatus.Unknown;

                  return (
                    <div className="rounded-lg border border-base-300 p-3" key={matchDay.id}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Link className="font-semibold text-petrol-900 hover:underline" to={`/match-days/${matchDay.id}`}>
                            {formatCardDate(matchDay)}
                          </Link>
                          {matchDay.location ? (
                            <p className="text-sm text-base-content/70">{matchDay.location}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {activePlayerId && canWriteAvailability ? (
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
                          ) : null}
                          {canAdmin ? (
                            <>
                              {matchDay.type === "date-finding" && matchDay.appointmentStatus === "planned" ? (
                                <button
                                  className="btn h-7 min-h-0 rounded-lg bg-primary px-2 py-0 text-xs leading-none text-primary-content"
                                  onClick={() => void updatePoll({ pollId: matchDay.id, finalizePlannedAppointment: true })}
                                  title="Als finalen Termin festlegen"
                                  type="button"
                                >
                                  Festlegen
                                </button>
                              ) : null}
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
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
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

function formatCardDate(matchDay: MatchDay): string {
  return `${new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(matchDay.date))}${matchDay.time ? ` um ${matchDay.time}` : ""}`;
}
