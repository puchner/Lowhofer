import { BadgeList } from "../components/ui/BadgeList";
import { genderLabel } from "../domain/labels";
import { usePlanner } from "../state/plannerStore";

export function PlayersPage() {
  const { players } = usePlanner();

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Kader</p>
        <h2 className="text-3xl font-bold text-petrol-900">Spielerverwaltung</h2>
        <p className="mt-2 max-w-2xl text-base-content/70">
          Stammdaten sind im MVP Mock-Daten. Mehrfachpositionen und Hauptpositionen sind bereits vorbereitet.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {players.map((player) => (
          <article className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm" key={player.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-petrol-900">{player.name}</h3>
                <p className="text-sm text-base-content/60">{genderLabel[player.gender]}</p>
              </div>
              {player.primaryPosition ? (
                <span className="badge badge-secondary text-petrol-900">{player.primaryPosition}</span>
              ) : null}
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
