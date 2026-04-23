import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { MatchHostCard } from "../components/match/MatchHostCard";
import { PollAdminActions } from "../components/polls/PollAdminActions";
import { PlayerPill } from "../components/players/PlayerPill";
import { analyzeMatchDay } from "../domain/analyzeSquad";
import { canFinalizeAppointment } from "../domain/pollHelpers";
import { sortPlayersForCurrentUser } from "../domain/playerSorting";
import { resolveVenueDetails } from "../domain/teamVenues";
import { AvailabilityStatus, MatchAvailability, Player } from "../domain/types";
import { StatusPill } from "../components/ui/StatusPill";
import { TrafficLight } from "../components/ui/TrafficLight";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function MatchDayDetailPage() {
  const navigate = useNavigate();
  const { matchDayId } = useParams();
  const { deletePoll, matchDays, players, updatePoll } = usePlanner();
  const { selectedPlayerId, selectedPlayerIsAdmin } = useSession();
  const matchDay = matchDays.find((item) => item.id === matchDayId);
  const canAdmin = selectedPlayerIsAdmin;

  const playerRows = useMemo(() => {
    if (!matchDay) {
      return [];
    }

    return sortPlayersForCurrentUser(players, selectedPlayerId).map((player) => ({
      player,
      availability: matchDay.availability.find((entry) => entry.playerId === player.id),
    }));
  }, [matchDay, players, selectedPlayerId]);

  if (!matchDay) {
    return (
      <section className="space-y-4">
        <p>Spieltag nicht gefunden.</p>
      </section>
    );
  }

  const currentMatchDay = matchDay;
  const analysis = analyzeMatchDay(currentMatchDay, players);
  const responseGroups = buildResponseGroups(playerRows);
  const venueDetails = resolveVenueDetails(currentMatchDay.opponent, currentMatchDay.homeAway);

  async function handleDelete() {
    await deletePoll(currentMatchDay.id);
    navigate("/");
  }

  async function handleFinalize() {
    await updatePoll({ pollId: currentMatchDay.id, finalizePlannedAppointment: true });
    navigate("/");
  }

  return (
    <section className="space-y-5">
      <MatchHostCard
        date={currentMatchDay.date}
        headerAction={
          canAdmin ? (
            <PollAdminActions
              canFinalize={canFinalizeAppointment(currentMatchDay)}
              matchDayId={currentMatchDay.id}
              onDelete={handleDelete}
              onFinalize={handleFinalize}
              size="md"
            />
          ) : undefined
        }
        homeAway={currentMatchDay.homeAway}
        location={currentMatchDay.location}
        meta={
          <>
            <span className="badge badge-primary badge-sm">{analysis.availableCount} Zusagen</span>
            <TrafficLight compact status={analysis.status} />
          </>
        }
        extra={
          venueDetails ? (
            <a
              className="flex items-start gap-2 rounded-md bg-base-200/60 px-3 py-2 text-sm transition hover:bg-base-200"
              href={venueDetails.mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
              <div className="space-y-1">
                {currentMatchDay.homeAway === "away" ? (
                  <>
                    {venueDetails.venueName ? <p className="font-semibold text-petrol-900">{venueDetails.venueName}</p> : null}
                    {venueDetails.address ? <p className="text-base-content/80">{venueDetails.address}</p> : null}
                  </>
                ) : venueDetails.venueName ? (
                  <p className="font-semibold text-petrol-900">{venueDetails.venueName}</p>
                ) : null}
              </div>
            </a>
          ) : undefined
        }
        opponent={currentMatchDay.opponent}
        time={currentMatchDay.time}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {responseGroups.map((group) => (
          <article className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm" key={group.status}>
            <div className="flex items-center justify-between gap-2">
              <StatusPill status={group.status} />
              <span className="text-sm font-bold text-base-content/60">{group.rows.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {group.rows.length > 0 ? (
                <>
                  {/* Spieler ohne Notiz: Kompakte Anzeige */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.rows
                      .filter((row) => !row.availability?.comment?.trim())
                      .map(({ player }) => (
                        <PlayerPill
                          isCurrentPlayer={player.id === selectedPlayerId}
                          key={player.id}
                          player={player}
                        />
                      ))}
                  </div>

                  {/* Spieler mit Notiz: Jeweils eine Zeile */}
                  <div className="space-y-1.5">
                    {group.rows
                      .filter((row) => row.availability?.comment?.trim())
                      .map(({ player, availability }) => (
                        <PlayerPill
                          comment={availability?.comment}
                          isCurrentPlayer={player.id === selectedPlayerId}
                          key={player.id}
                          player={player}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <span className="text-sm text-base-content/50">Niemand</span>
              )}
            </div>
          </article>
        ))}
      </section>

    </section>
  );
}

type PlayerRow = {
  player: Player;
  availability: MatchAvailability | undefined;
};

const responseOrder = [
  AvailabilityStatus.Available,
  AvailabilityStatus.Maybe,
  AvailabilityStatus.Unknown,
  AvailabilityStatus.Unavailable,
];

function buildResponseGroups(rows: PlayerRow[]) {
  return responseOrder.map((status) => ({
    status,
    rows: rows.filter((row) => (row.availability?.status ?? AvailabilityStatus.Unknown) === status),
  }));
}
