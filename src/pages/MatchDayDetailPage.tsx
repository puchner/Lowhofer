import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analyzeMatchDay } from "../domain/analyzeSquad";
import { availabilityLabel, genderLabel } from "../domain/labels";
import { AvailabilityStatus } from "../domain/types";
import { BadgeList } from "../components/ui/BadgeList";
import { RuleCard } from "../components/ui/RuleCard";
import { StatusPill } from "../components/ui/StatusPill";
import { TrafficLight } from "../components/ui/TrafficLight";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function MatchDayDetailPage() {
  const { matchDayId } = useParams();
  const { deletePoll, matchDays, players, updatePoll } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | "all">("all");
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

  const analysis = analyzeMatchDay(matchDay, players);
  const filteredRows = playerRows.filter(
    (row) => statusFilter === "all" || row.availability?.status === statusFilter,
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="link link-primary text-sm" to="/">
            Zurück
          </Link>
          <h2 className="mt-2 text-3xl font-bold text-petrol-900">{matchDay.opponent}</h2>
          <p className="text-base-content/70">
            {formatDate(matchDay.date)} {matchDay.time ? `um ${matchDay.time}` : ""} · {matchDay.location}
          </p>
          {canAdmin ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {matchDay.type === "date-finding" ? (
                <button
                  className="btn btn-sm btn-primary rounded-lg"
                  onClick={() => void updatePoll({ pollId: matchDay.id, type: "match" })}
                  type="button"
                >
                  Zu Match machen
                </button>
              ) : null}
              {matchDay.status === "open" ? (
                <button
                  className="btn btn-sm rounded-lg bg-base-300"
                  onClick={() => void updatePoll({ pollId: matchDay.id, status: "archived" })}
                  type="button"
                >
                  Archivieren
                </button>
              ) : null}
              <button
                className="btn btn-sm btn-error rounded-lg"
                onClick={() => void deletePoll(matchDay.id)}
                type="button"
              >
                Löschen
              </button>
            </div>
          ) : null}
        </div>
        <TrafficLight status={analysis.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RuleCard title="Zusagen" value={`${analysis.availableCount}`} />
        <RuleCard
          title="Fehlende Positionen"
          value={analysis.missingPositions.length ? analysis.missingPositions.join(", ") : "keine"}
        />
        <RuleCard
          title="Mixed-Regel"
          value={analysis.mixedRuleCheck.passed ? "erfüllt" : "offen"}
          result={analysis.mixedRuleCheck}
        />
        <RuleCard
          title="Mindestbesetzung"
          value={analysis.minimumPlayersCheck.passed ? "erfüllt" : "offen"}
          result={analysis.minimumPlayersCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-bold text-petrol-900">Rückmeldungen</h3>
            <select
              className="select select-bordered select-sm w-full rounded-lg sm:w-56"
              onChange={(event) => setStatusFilter(event.target.value as AvailabilityStatus | "all")}
              value={statusFilter}
            >
              <option value="all">Alle Status</option>
              {Object.values(AvailabilityStatus).map((status) => (
                <option key={status} value={status}>
                  {availabilityLabel[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredRows.map(({ player, availability }) => (
              <article className="rounded-lg border border-base-300 p-3" key={player.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-petrol-900">{player.name}</p>
                    <p className="text-sm text-base-content/60">
                      {genderLabel[player.gender]}
                      {player.primaryPosition ? ` · Hauptposition: ${player.primaryPosition}` : ""}
                    </p>
                  </div>
                  <StatusPill status={availability?.status ?? AvailabilityStatus.Unknown} />
                </div>
                <div className="mt-3">
                  <BadgeList items={player.positions} tone="neutral" />
                </div>
                {availability?.comment ? (
                  <p className="mt-2 text-sm text-base-content/70">{availability.comment}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-xl font-bold text-petrol-900">Analyse</h3>
            <div className="mt-4 space-y-4">
              <AnalysisBlock
                title="Gut besetzt"
                value={
                  analysis.coverage
                    .filter((result) => result.availablePlayers.length > result.required)
                    .map((result) => result.position)
                    .join(", ") || "Noch keine Rolle komfortabel besetzt."
                }
              />
              <AnalysisBlock
                title="Fehlende Rollen"
                value={analysis.missingPositions.join(", ") || "Keine Pflichtrolle fehlt."}
              />
              <AnalysisBlock
                title="Flexible Spieler"
                value={
                  analysis.flexiblePlayers.map((player) => player.name).join(", ") ||
                  "Keine Zusage mit drei oder mehr Positionen."
                }
              />
              <AnalysisBlock
                title="Mögliche Besetzung"
                value={
                  analysis.possibleLineup
                    ?.map((slot) => `${slot.role}: ${slot.player.name}`)
                    .join(" · ") || "Noch keine robuste Feldbesetzung gefunden."
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-warning/40 bg-warning/10 p-4">
            <h3 className="font-bold text-petrol-900">Hinweise</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {analysis.warnings.length > 0 ? (
                analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)
              ) : (
                <li>Keine akuten Warnhinweise.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}

function AnalysisBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-1 text-sm text-base-content/80">{value}</p>
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
