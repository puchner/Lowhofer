import { CalendarSync, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCalendarFeedUrl, fetchLeagueTable } from "../api/plannerApi";
import { CalendarSubscriptionDialog } from "../components/calendar/CalendarSubscriptionDialog";
import { HomeAwayIcon } from "../components/match/MatchHostCard";
import { MatchDayCard } from "../components/matchDays/MatchDayCard";
import { PollAdminActions } from "../components/polls/PollAdminActions";
import { AvailabilityButtons } from "../components/ui/AvailabilityButtons";
import { TrafficLight } from "../components/ui/TrafficLight";
import { analyzeMatchDay } from "../domain/analyzeSquad";
import { formatMatchDateTime } from "../domain/dateAndTimeUtils";
import { groupMatchDays } from "../domain/matchDayGroups";
import { getAllUpcomingMatchDays } from "../domain/matchDayFilters";
import { canFinalizeAppointment } from "../domain/pollHelpers";
import { isTrainingMemberRole } from "../domain/playerRoles";
import { LeagueStanding } from "../domain/leagueTypes";
import { AvailabilityStatus, MatchDay } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function DashboardPage() {
  const { deletePoll, error, isLoading, matchDays, players, refresh, updateAvailability, updatePoll } = usePlanner();
  const session = useSession();
  const [isOpeningCalendarFeed, setIsOpeningCalendarFeed] = useState(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = useState<string | null>(null);
  const [calendarWebcalUrl, setCalendarWebcalUrl] = useState<string | null>(null);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[] | null>(null);
  const activePlayerId = session.selectedPlayerId;
  const canAdmin = session.selectedPlayerIsAdmin;
  const canWriteAvailability = !isTrainingMemberRole(session.selectedPlayerRole ?? undefined);
  const allUpcomingMatchDays = getAllUpcomingMatchDays(matchDays);
  const groupedMatchDays = groupMatchDays(allUpcomingMatchDays);

  useEffect(() => {
    fetchLeagueTable()
      .then((tableData) => setLeagueStandings(tableData.standings))
      .catch(() => {});
  }, []);

  async function handleOpenCalendarFeed() {
    setIsOpeningCalendarFeed(true);

    try {
      const feedUrl = await fetchCalendarFeedUrl();
      const webcalUrl = toWebcalUrl(feedUrl);

      setCalendarFeedUrl(feedUrl);
      setCalendarWebcalUrl(webcalUrl);
      setIsCalendarDialogOpen(true);

      if (shouldOpenCalendarDirectly()) {
        window.location.assign(webcalUrl ?? feedUrl);
      }
    } catch (nextError) {
      window.alert(nextError instanceof Error ? nextError.message : "Kalender-Link konnte nicht geladen werden.");
    } finally {
      setIsOpeningCalendarFeed(false);
    }
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Termine</h2>
          <div className="flex items-center gap-2">
            <button
              aria-label="Kalender abonnieren"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-petrol-900 transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isOpeningCalendarFeed}
              onClick={() => void handleOpenCalendarFeed()}
              title="Kalender abonnieren"
              type="button"
            >
              <CalendarSync aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            </button>
            {canAdmin ? (
              <Link
                aria-label="Abstimmung anlegen"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-petrol-900 transition hover:bg-base-200"
                title="Abstimmung anlegen"
                to="/polls/new"
              >
                <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <CalendarSubscriptionDialog
        feedUrl={calendarFeedUrl}
        isOpen={isCalendarDialogOpen}
        onClose={() => setIsCalendarDialogOpen(false)}
        webcalUrl={calendarWebcalUrl}
      />

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
              <PollAdminActions
                canFinalize={canFinalizeAppointment(matchDay)}
                matchDayId={matchDay.id}
                onDelete={() => void deletePoll(matchDay.id)}
                onFinalize={() => void updatePoll({ pollId: matchDay.id, finalizePlannedAppointment: true })}
              />
            ) : undefined;

            return (
              <MatchDayCard
                action={cardAction}
                detailPath={`/match-days/${matchDay.id}`}
                headerAction={headerAction}
                key={matchDay.id}
                matchDay={matchDay}
                players={players}
                standings={leagueStandings ?? undefined}
              />
            );
          }

          return (
            <section className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm" key={group.matchId}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <HomeAwayIcon homeAway={group.matchDays[0].homeAway} />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-petrol-900 sm:text-lg">{group.label}</h3>
                    <p className="mt-1 text-sm text-base-content/70">{group.matchDays.length} Terminvorschläge</p>
                  </div>
                </div>
                {canAdmin ? (
                  <PollAdminActions
                    canFinalize={false}
                    matchDayId={group.matchDays[0].id}
                    onDelete={() => void handleDeleteGroup(group.matchDays)}
                    onFinalize={() => void updatePoll({ pollId: group.matchDays[0].id, finalizePlannedAppointment: true })}
                  />
                ) : null}
              </div>

              <div className="mt-3 grid gap-3">
                {group.matchDays.map((matchDay) => {
                  const activeAvailability =
                    activePlayerId === null
                      ? undefined
                      : matchDay.availability.find((entry) => entry.playerId === activePlayerId);
                  const availability = activeAvailability?.status ?? AvailabilityStatus.Unknown;
                  const analysis = analyzeMatchDay(matchDay, players);

                  return (
                    <article className="rounded-lg border border-base-300 p-3" key={matchDay.id}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <Link
                            className="font-semibold text-petrol-900 underline-offset-4 hover:underline"
                            to={`/match-days/${matchDay.id}`}
                          >
                            {formatMatchDateTime(matchDay.date, matchDay.time)}
                          </Link>
                          {matchDay.location ? <p className="mt-1 text-sm text-base-content/70">{matchDay.location}</p> : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="badge badge-primary badge-sm">{analysis.availableCount} Zusagen</span>
                            <TrafficLight compact status={analysis.status} />
                          </div>
                        </div>
                        <div className="w-full lg:max-w-72 lg:shrink-0">
                          <div className="space-y-2">
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
                            {canAdmin && canFinalizeAppointment(matchDay) ? (
                              <button
                                className="btn h-8 min-h-0 w-full rounded-lg bg-primary px-3 py-0 text-sm text-primary-content"
                                onClick={() => void updatePoll({ pollId: matchDay.id, finalizePlannedAppointment: true })}
                                title="Als finalen Termin festlegen"
                                type="button"
                              >
                                Festlegen
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

    </section>
  );

  async function handleDeleteGroup(groupMatchDays: MatchDay[]) {
    for (const matchDay of groupMatchDays) {
      await deletePoll(matchDay.id);
    }

    await refresh();
  }
}

function shouldOpenCalendarDirectly(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function toWebcalUrl(feedUrl: string): string | null {
  const feedLocation = new URL(feedUrl);
  const isLocalHost = feedLocation.hostname === "localhost" || feedLocation.hostname === "127.0.0.1";

  if (isLocalHost) {
    return feedUrl;
  }

  return `webcal://${feedLocation.host}${feedLocation.pathname}${feedLocation.search}`;
}
