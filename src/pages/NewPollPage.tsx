import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MatchHostCard } from "../components/match/MatchHostCard";
import { SuggestionEditor } from "../components/polls/SuggestionEditor";
import {
  buildCreatePollInputForFixture,
  createSuggestionDraftFromFixture,
  getOpenLeagueFixtures,
  normalizeSuggestionDrafts,
  SuggestionDraft,
} from "../domain/pollHelpers";
import { canManageMatches } from "../domain/permissions";
import { useCurrentUserCapabilities } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function NewPollPage() {
  const navigate = useNavigate();
  const { createPoll, leagueFixtures, matchDays } = usePlanner();
  const currentUser = useCurrentUserCapabilities();
  const [selectedFixtureId, setSelectedFixtureId] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionDraft[]>([]);
  const openLeagueFixtures = useMemo(() => getOpenLeagueFixtures(leagueFixtures, matchDays), [leagueFixtures, matchDays]);
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

    setSuggestions([createSuggestionDraftFromFixture(selectedFixture)]);
  }, [selectedFixture]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFixture) {
      return;
    }

    const normalizedSuggestions = normalizeSuggestionDrafts(suggestions);

    if (normalizedSuggestions.length === 0) {
      return;
    }

    await createPoll(buildCreatePollInputForFixture(selectedFixture, normalizedSuggestions));
    navigate("/");
  }

  if (!canManageMatches(currentUser)) {
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

                <SuggestionEditor
                  heading="Terminvorschläge"
                  onChange={setSuggestions}
                  requireDate
                  suggestions={suggestions}
                />

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
