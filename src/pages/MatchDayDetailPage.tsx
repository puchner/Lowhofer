import { BusFront, CircleHelp, House, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { analyzeMatchDay } from "../domain/analyzeSquad";
import { AvailabilityStatus, MatchAvailability, Player } from "../domain/types";
import { StatusPill } from "../components/ui/StatusPill";
import { TrafficLight } from "../components/ui/TrafficLight";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function MatchDayDetailPage() {
  const navigate = useNavigate();
  const { matchDayId } = useParams();
  const { deletePoll, matchDays, players } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const matchDay = matchDays.find((item) => item.id === matchDayId);
  const canAdmin = selectedPlayerIsAdmin;

  const playerRows = useMemo(() => {
    if (!matchDay) {
      return [];
    }

    return players.map((player) => ({
      player,
      availability: matchDay.availability.find((entry) => entry.playerId === player.id),
    }));
  }, [matchDay, players]);

  if (!matchDay) {
    return (
      <section className="space-y-4">
        <p>Spieltag nicht gefunden.</p>
        <Link className="btn btn-primary rounded-lg" to="/">
          Zurück zum Dashboard
        </Link>
      </section>
    );
  }

  const currentMatchDay = matchDay;
  const analysis = analyzeMatchDay(currentMatchDay, players);
  const responseGroups = buildResponseGroups(playerRows);

  async function handleDelete() {
    await deletePoll(currentMatchDay.id);
    navigate("/");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link className="link link-primary text-sm" to="/">
              Zurück
            </Link>
            <div className="mt-3 flex min-w-0 items-center gap-2">
              <HomeAwayIcon homeAway={currentMatchDay.homeAway} />
              <h2 className="truncate text-3xl font-bold text-petrol-900">{currentMatchDay.opponent}</h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-base-content/70">
              <span>
                {formatDate(currentMatchDay.date)} {currentMatchDay.time ? `um ${currentMatchDay.time}` : ""}
              </span>
              <TrafficLight compact status={analysis.status} />
            </div>
          </div>
          {canAdmin ? <AdminActions matchDayId={currentMatchDay.id} onDelete={handleDelete} /> : null}
        </div>
      </div>

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
                        <span
                          className="rounded-lg bg-base-200 px-2 py-1 text-sm font-semibold text-petrol-900"
                          key={player.id}
                        >
                          {player.name}
                        </span>
                      ))}
                  </div>

                  {/* Spieler mit Notiz: Jeweils eine Zeile */}
                  <div className="space-y-1.5">
                    {group.rows
                      .filter((row) => row.availability?.comment?.trim())
                      .map(({ player, availability }) => (
                        <div
                          className="flex flex-wrap items-baseline gap-x-1.5 rounded-lg bg-base-200 px-2 py-1.5 text-sm"
                          key={player.id}
                        >
                          <span className="font-bold text-petrol-900">{player.name}</span>
                          <span className="italic text-base-content/70">{availability?.comment}</span>
                        </div>
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

function AdminActions({ matchDayId, onDelete }: { matchDayId: string; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link
        aria-label="Abstimmung bearbeiten"
        className="btn h-8 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-base-content"
        title="Bearbeiten"
        to={`/polls/${matchDayId}/edit`}
      >
        <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </Link>
      <button
        aria-label="Abstimmung löschen"
        className="btn h-8 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-error hover:bg-error hover:text-white"
        onClick={onDelete}
        title="Löschen"
        type="button"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function HomeAwayIcon({ homeAway }: { homeAway: "home" | "away" | "unknown" }) {
  const iconClassName = "h-6 w-6 shrink-0";

  if (homeAway === "home") {
    return <House aria-label="Heimspiel" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  if (homeAway === "away") {
    return <BusFront aria-label="Auswärts" className={`${iconClassName} text-primary`} strokeWidth={2.2} />;
  }

  return <CircleHelp aria-label="Ort offen" className={`${iconClassName} text-base-content/50`} strokeWidth={2.2} />;
}
