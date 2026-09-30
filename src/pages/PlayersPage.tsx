import { Plus, Pencil } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BadgeList } from "../components/ui/BadgeList";
import { PlayerAvatar } from "../components/players/PlayerAvatar";
import { TemporaryUnavailableStatus } from "../components/players/TemporaryUnavailableStatus";
import { genderLabel } from "../domain/labels";
import { canManagePlayers } from "../domain/permissions";
import { sortPlayersForCurrentUser } from "../domain/playerSorting";
import { useCurrentUserCapabilities, useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

interface PlayersLocationState {
  focusPlayerId?: string;
}

export function PlayersPage() {
  const { players } = usePlanner();
  const session = useSession();
  const currentUser = useCurrentUserCapabilities();
  const location = useLocation();
  const focusPlayerId = (location.state as PlayersLocationState | null)?.focusPlayerId;
  const sortedPlayers = sortPlayersForCurrentUser(players, session.selectedPlayerId);
  const canAddPlayers = canManagePlayers(currentUser);

  useEffect(() => {
    if (!focusPlayerId) return;
    const playerCard = document.getElementById(`player-${focusPlayerId}`);
    playerCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    playerCard?.focus({ preventScroll: true });
  }, [focusPlayerId, players]);

  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Spieler</h2>
        {canAddPlayers ? (
          <Link
            aria-label="Spieler hinzufügen"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-petrol-900 transition hover:bg-base-200"
            title="Spieler hinzufügen"
            to="/players/new"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sortedPlayers.map((player) => (
          <article
            className={`relative rounded-lg border p-4 shadow-sm transition-colors ${
              player.tempUnavailableReason ? "border-neutral/20 bg-neutral/10" : "bg-base-100"} ${
              player.id === focusPlayerId
                ? "border-secondary ring-2 ring-secondary/60"
                : player.tempUnavailableReason ? "" : "border-primary/15"
            }`}
            id={`player-${player.id}`}
            key={player.id}
            tabIndex={-1}
          >
            {player.id === session.selectedPlayerId || canAddPlayers ? (
              <Link
                aria-label={`Spieler ${player.name} bearbeiten`}
                className="btn absolute right-3 top-3 z-10 h-8 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-base-content"
                title="Bearbeiten"
                to={player.id === session.selectedPlayerId ? "/profile" : `/players/${encodeURIComponent(player.id)}/edit`}
              >
                <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              </Link>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar player={player} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-lg font-bold ${player.tempUnavailableReason ? "text-base-content/60" : "text-petrol-900"}`}>
                      {player.name}
                    </h3>
                    {player.id === session.selectedPlayerId ? (
                      <span className="badge badge-primary text-white">Du</span>
                    ) : null}
                    {player.id === focusPlayerId ? <span className="badge badge-secondary">Neu</span> : null}
                  </div>
                  <p className="text-sm text-base-content/60">{genderLabel[player.gender]}</p>
                </div>
              </div>
              {player.primaryPosition ? (
                <span className="mr-10 shrink-0 self-start badge badge-secondary text-petrol-900">
                  {player.primaryPosition}
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <BadgeList items={player.positions} tone="primary" />
            </div>
            {player.tempUnavailableReason ? (
              <div className="mt-3">
                <TemporaryUnavailableStatus note={player.tempUnavailableNote} reason={player.tempUnavailableReason} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
