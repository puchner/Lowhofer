import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MatchHostCard } from "../components/match/MatchHostCard";
import { LeagueFixture } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

type SuggestionDraft = {
  date: string;
  time: string;
};

export function NewPollPage() {
  const navigate = useNavigate();
  const { createPoll, leagueFixtures, matchDays } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const [selectedFixtureId, setSelectedFixtureId] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionDraft[]>([]);
  const openLeagueFixtures = useMemo(
    () => {
      // Ein Ligaspiel gilt als "offen" nur, wenn noch keine offene Abstimmung existiert.
      // Das deckt sowohl bereits scheduled Termine als auch laufende Mehrfachvorschläge ab.
      const blockedFixtureIds = new Set(
        matchDays
          .filter((matchDay) => matchDay.status === "open")
          .map((matchDay) => matchDay.leagueGameNr ?? matchDay.sourceFixtureId)
          .filter(Boolean),
      );

      return leagueFixtures.filter((fixture) => !blockedFixtureIds.has(fixture.id));
    },
    [leagueFixtures, matchDays],
  );
  const selectedFixture = openLeagueFixtures.find((fixture) => fixture.id === selectedFixtureId);

  useEffect(() => {
    if (!selectedFixtureId && openLeagueFixtures.length > 0) {
      setSelectedFixtureId(openLeagueFixtures[0].id);
      return;
    }

    if (selectedFixtureId && !openLeagueFixtures.some((fixture) => fixture.id === selectedFixtureId)) {
      setSelectedFixtureId(openLeagueFixtures[0]?.id ?? "");
    }
  }, [openLeagueFixtures, selectedFixtureId]);

  useEffect(() => {
    if (!selectedFixture) {
      setSuggestions([]);
      return;
    }

    setSuggestions([createInitialSuggestion(selectedFixture)]);
  }, [selectedFixture]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFixture) {
      return;
    }

    const normalizedSuggestions = suggestions
      .map((suggestion) => ({
        date: suggestion.date.trim(),
        time: suggestion.time.trim() || undefined,
      }))
      .filter((suggestion) => suggestion.date);

    if (normalizedSuggestions.length === 0) {
      return;
    }

    await createPoll({
      title: selectedFixture.opponent,
      type: normalizedSuggestions.length === 1 ? "match" : "date-finding",
      date: normalizedSuggestions.length === 1 ? normalizedSuggestions[0].date : undefined,
      time: normalizedSuggestions.length === 1 ? normalizedSuggestions[0].time : undefined,
      opponent: selectedFixture.opponent,
      homeAway: selectedFixture.homeAway,
      sourceFixtureId: selectedFixture.id,
      suggestions: normalizedSuggestions.length > 1 ? normalizedSuggestions : undefined,
    });
    navigate("/");
  }

  if (!selectedPlayerIsAdmin) {
    return (
      <section className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <h2 className="text-xl font-bold text-petrol-900">Admin-Funktion</h2>
        <p className="mt-2 text-sm text-base-content/70">Nur Pia und Volker können Abstimmungen anlegen.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Abstimmung anlegen</h2>
        <p className="mt-2 max-w-2xl text-sm text-base-content/70">
          Offenes Ligaspiel auswählen und einen oder mehrere Terminvorschläge eintragen.
        </p>
      </div>

      {openLeagueFixtures.length === 0 ? (
        <section className="rounded-lg border border-dashed border-base-300 bg-base-100 p-4 text-sm text-base-content/70">
          Kein offenes Ligaspiel ohne scheduled Termin gefunden.
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <section className="space-y-3 rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4">
            <h3 className="text-lg font-bold text-petrol-900">Offene Ligaspiele</h3>
            <div className="space-y-2">
              {openLeagueFixtures.map((fixture) => {
                const isActive = fixture.id === selectedFixtureId;

                return (
                  <MatchHostCard
                    date={fixture.date}
                    homeAway={fixture.homeAway}
                    key={fixture.id}
                    onClick={() => setSelectedFixtureId(fixture.id)}
                    opponent={fixture.opponent}
                    selected={isActive}
                    time={fixture.time}
                  />
                );
              })}
            </div>
          </section>

          <form
            className="space-y-3 rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4"
            onSubmit={handleSubmit}
          >
            <h3 className="text-lg font-bold text-petrol-900">Neue Abstimmung</h3>
            {selectedFixture ? (
              <>
                <MatchHostCard
                  date={selectedFixture.date}
                  homeAway={selectedFixture.homeAway}
                  opponent={selectedFixture.opponent}
                  time={selectedFixture.time}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-base-content/60">Terminvorschläge</p>
                  </div>
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
                        required
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
                        onClick={() =>
                          setSuggestions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        type="button"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-outline min-h-11 rounded-lg"
                    onClick={() => setSuggestions((current) => [...current, createEmptySuggestion()])}
                    type="button"
                  >
                    + Vorschlag
                  </button>
                </div>

                <button className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900" type="submit">
                  Abstimmung anlegen
                </button>
              </>
            ) : null}
          </form>
        </div>
      )}
    </section>
  );
}

function createInitialSuggestion(fixture: LeagueFixture): SuggestionDraft {
  return {
    date: fixture.date ?? "",
    time: fixture.time ?? "",
  };
}

function createEmptySuggestion(): SuggestionDraft {
  return {
    date: "",
    time: "",
  };
}
