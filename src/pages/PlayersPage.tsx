import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { BadgeList } from "../components/ui/BadgeList";
import { PlayerAvatar } from "../components/players/PlayerAvatar";
import { genderLabel } from "../domain/labels";
import { sortPlayersForCurrentUser } from "../domain/playerSorting";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function PlayersPage() {
  const { players } = usePlanner();
  const { selectedPlayerId } = useSession();
  const sortedPlayers = sortPlayersForCurrentUser(players, selectedPlayerId);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Kader</p>
        <h2 className="text-3xl font-bold text-petrol-900">Spielerverwaltung</h2>
        <p className="mt-2 max-w-2xl text-base-content/70">
          Stammdaten kommen aus Supabase. Mehrfachpositionen und Hauptpositionen sind bereits vorbereitet.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sortedPlayers.map((player) => (
          <article className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm" key={player.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar player={player} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-petrol-900">{player.name}</h3>
                    {player.id === selectedPlayerId ? (
                      <span className="badge badge-primary text-white">Du</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-base-content/60">{genderLabel[player.gender]}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start">
                {player.primaryPosition ? (
                  <span className="badge badge-secondary text-petrol-900">{player.primaryPosition}</span>
                ) : null}
                {player.id === selectedPlayerId ? (
                  <Link
                    aria-label="Eigenes Profil bearbeiten"
                    className="btn h-8 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-base-content"
                    title="Bearbeiten"
                    to="/profile"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              <BadgeList items={player.positions} tone="primary" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
