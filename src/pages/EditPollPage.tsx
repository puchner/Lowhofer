import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MatchHostCard } from "../components/match/MatchHostCard";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

type SuggestionDraft = {
  date: string;
  time: string;
};

export function EditPollPage() {
  const navigate = useNavigate();
  const { matchDayId } = useParams();
  const { createPoll, deletePoll, matchDays, updatePoll } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const matchDay = useMemo(() => matchDays.find((item) => item.id === matchDayId), [matchDayId, matchDays]);
  const existingSuggestions = useMemo(() => {
    if (!matchDay) {
      return [];
    }

    if (matchDay.matchId && matchDay.type === "date-finding") {
      return [...matchDays]
        .filter(
          (item) =>
            item.matchId === matchDay.matchId &&
            item.type === "date-finding" &&
            item.appointmentStatus === "planned",
        )
        .sort((left, right) => left.date.localeCompare(right.date));
    }

    return [matchDay];
  }, [matchDay, matchDays]);
  const canAddSuggestions = matchDay?.type === "date-finding" && matchDay.appointmentStatus === "planned";
  const [suggestions, setSuggestions] = useState<SuggestionDraft[]>([{ date: "", time: "" }]);
  const [removedSuggestionIds, setRemovedSuggestionIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleExistingSuggestions = existingSuggestions.filter((suggestion) => !removedSuggestionIds.includes(suggestion.id));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!matchDay || !canAddSuggestions) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (canAddSuggestions) {
        const newSuggestions = suggestions
          .map((suggestion) => ({
            date: suggestion.date.trim(),
            time: suggestion.time.trim() || undefined,
          }))
          .filter((suggestion) => suggestion.date);
        const remainingSuggestionCount = visibleExistingSuggestions.length;
        const finalSuggestionCount = remainingSuggestionCount + newSuggestions.length;

        if (finalSuggestionCount === 0) {
          throw new Error("suggestions_required");
        }

        for (const suggestionId of removedSuggestionIds) {
          await deletePoll(suggestionId);
        }

        if (finalSuggestionCount === 1) {
          if (remainingSuggestionCount === 1 && newSuggestions.length === 0) {
            await updatePoll({
              pollId: visibleExistingSuggestions[0].id,
              finalizePlannedAppointment: true,
            });
          } else if (remainingSuggestionCount === 0 && newSuggestions.length === 1) {
            await createPoll({
              title: matchDay.title,
              type: "match",
              date: newSuggestions[0].date,
              time: newSuggestions[0].time,
              opponent: matchDay.opponent,
              homeAway: matchDay.homeAway,
              sourceFixtureId: matchDay.sourceFixtureId ?? matchDay.leagueGameNr,
            });
          } else if (newSuggestions.length > 0) {
            await createPoll({
              title: matchDay.title,
              type: "date-finding",
              opponent: matchDay.opponent,
              homeAway: matchDay.homeAway,
              sourceFixtureId: matchDay.sourceFixtureId ?? matchDay.leagueGameNr,
              suggestions: newSuggestions,
            });
          }
        } else if (newSuggestions.length > 0) {
          await createPoll({
            title: matchDay.title,
            type: "date-finding",
            opponent: matchDay.opponent,
            homeAway: matchDay.homeAway,
            sourceFixtureId: matchDay.sourceFixtureId ?? matchDay.leagueGameNr,
            suggestions: newSuggestions,
          });
        }
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemoveExistingSuggestion(suggestionId: string) {
    setRemovedSuggestionIds((current) => (current.includes(suggestionId) ? current : [...current, suggestionId]));
  }

  if (!selectedPlayerIsAdmin) {
    return (
      <section className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <h2 className="text-xl font-bold text-petrol-900">Admin-Funktion</h2>
        <p className="mt-2 text-sm text-base-content/70">Nur Admins können Abstimmungen bearbeiten.</p>
      </section>
    );
  }

  if (!matchDay) {
    return (
      <section className="space-y-4">
        <p>Abstimmung nicht gefunden.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary sm:text-sm">Bearbeiten</p>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Abstimmung bearbeiten</h2>
      </div>

      <form
        className="space-y-3 rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4"
        onSubmit={handleSubmit}
      >
        <MatchHostCard
          date={matchDay.date}
          homeAway={matchDay.homeAway}
          opponent={matchDay.opponent}
          time={matchDay.time}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-base-content/60">Bestehende Vorschläge</p>
          {existingSuggestions.map((suggestion) => {
            const isRemoved = removedSuggestionIds.includes(suggestion.id);

            return (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={suggestion.id}>
              <input
                className={`input input-bordered min-h-11 w-full rounded-lg text-base-content/70 ${
                  isRemoved ? "border-dashed bg-base-100 opacity-60" : "bg-base-200"
                }`}
                disabled
                type="date"
                value={suggestion.date}
              />
              <input
                className={`input input-bordered min-h-11 w-full rounded-lg text-base-content/70 ${
                  isRemoved ? "border-dashed bg-base-100 opacity-60" : "bg-base-200"
                }`}
                disabled
                type="time"
                value={suggestion.time ?? ""}
              />
              <button
                className={`btn min-h-11 rounded-lg ${isRemoved ? "btn-disabled" : "text-error hover:bg-error hover:text-white"}`}
                disabled={isRemoved}
                onClick={() => handleRemoveExistingSuggestion(suggestion.id)}
                type="button"
              >
                {isRemoved ? "Entfernt" : "Entfernen"}
              </button>
            </div>
            );
          })}
        </div>

        {canAddSuggestions ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-base-content/60">Neue Vorschläge</p>
            {suggestions.map((suggestion, index) => (
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={`${index}-${suggestion.date}-${suggestion.time}`}>
                <input
                  className="input input-bordered min-h-11 w-full rounded-lg"
                  onChange={(event) =>
                    setSuggestions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, date: event.target.value } : item,
                      ),
                    )
                  }
                  type="date"
                  value={suggestion.date}
                />
                <input
                  className="input input-bordered min-h-11 w-full rounded-lg"
                  onChange={(event) =>
                    setSuggestions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, time: event.target.value } : item,
                      ),
                    )
                  }
                  type="time"
                  value={suggestion.time}
                />
                <button
                  className="btn min-h-11 rounded-lg"
                  disabled={suggestions.length === 1}
                  onClick={() => setSuggestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  Entfernen
                </button>
              </div>
            ))}
            <button
              className="btn btn-outline min-h-11 rounded-lg"
              onClick={() => setSuggestions((current) => [...current, { date: "", time: "" }])}
              type="button"
            >
              + Vorschlag
            </button>
          </div>
        ) : null}

        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
        {canAddSuggestions ? (
          <button className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900" disabled={isSaving} type="submit">
            {isSaving ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
        ) : null}
      </form>
    </section>
  );
}
