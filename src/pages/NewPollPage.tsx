import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PollType } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

const todayKey = new Date().toISOString().slice(0, 10);

type SuggestionDraft = {
  date: string;
  time: string;
  location: string;
};

export function NewPollPage() {
  const navigate = useNavigate();
  const { createPoll, leagueFixtures, matchDays } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState("");
  const [type, setType] = useState<PollType>("date-finding");
  const [homeAway, setHomeAway] = useState<"home" | "away" | "unknown">("unknown");
  const [suggestions, setSuggestions] = useState<SuggestionDraft[]>([{ date: todayKey, time: "", location: "" }]);
  const existingFixtureIds = new Set(
    matchDays.map((matchDay) => matchDay.leagueGameNr ?? matchDay.sourceFixtureId).filter(Boolean),
  );

  async function createFromFixture(fixtureId: string) {
    const fixture = leagueFixtures.find((item) => item.id === fixtureId);

    if (!fixture?.date) {
      return;
    }

    await createPoll({
      title: fixture.opponent,
      type: "match",
      date: fixture.date,
      time: fixture.time,
      opponent: fixture.opponent,
      homeAway: fixture.homeAway,
      sourceFixtureId: fixture.id,
    });
    navigate("/");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await createPoll({
      title: title.trim() || opponent.trim(),
      type,
      date: type === "match" ? date : undefined,
      time: type === "match" ? time || undefined : undefined,
      opponent: opponent.trim() || "Offen",
      homeAway,
      suggestions:
        type === "date-finding"
          ? suggestions.map((suggestion) => ({
              date: suggestion.date,
              time: suggestion.time || undefined,
              location: suggestion.location || undefined,
            }))
          : undefined,
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
        <p className="text-xs font-semibold uppercase text-primary sm:text-sm">Neu</p>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Abstimmung anlegen</h2>
      </div>

      <section className="rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4">
        <h3 className="text-lg font-bold text-petrol-900">Aus Liga-Spielplan</h3>
        <div className="mt-3 grid gap-2">
          {leagueFixtures.map((fixture) => {
            const alreadyExists = existingFixtureIds.has(fixture.id);
            const canCreate = Boolean(fixture.date) && !alreadyExists;

            return (
              <article className="rounded-lg border border-base-300 p-3" key={fixture.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-petrol-900">{fixture.opponent}</p>
                    <p className="text-sm text-base-content/70">
                      {fixture.date ?? "Termin offen"} {fixture.time ? `um ${fixture.time}` : ""} ·{" "}
                      {fixture.homeAway === "home" ? "Heimspiel" : "Auswärts"}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary min-h-11 rounded-lg"
                    disabled={!canCreate}
                    onClick={() => void createFromFixture(fixture.id)}
                    type="button"
                  >
                    {alreadyExists ? "Schon angelegt" : fixture.date ? "Anlegen" : "Datum fehlt"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <form className="space-y-3 rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold text-petrol-900">Benutzerdefiniert</h3>
        <select
          className="select select-bordered min-h-11 w-full rounded-lg"
          onChange={(event) => setType(event.target.value as PollType)}
          value={type}
        >
          <option value="date-finding">Terminabstimmung</option>
          <option value="match">Match</option>
        </select>
        <input
          className="input input-bordered min-h-11 w-full rounded-lg"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titel"
          value={title}
        />
        <input
          className="input input-bordered min-h-11 w-full rounded-lg"
          onChange={(event) => setOpponent(event.target.value)}
          placeholder="Gegner oder Anlass"
          required
          value={opponent}
        />
        {type === "match" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input input-bordered min-h-11 w-full rounded-lg"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
            <input
              className="input input-bordered min-h-11 w-full rounded-lg"
              onChange={(event) => setTime(event.target.value)}
              type="time"
              value={time}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-base-content/60">Terminvorschläge</p>
            {suggestions.map((suggestion, index) => (
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]" key={`${index}-${suggestion.date}-${suggestion.time}`}>
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
                <input
                  className="input input-bordered min-h-11 w-full rounded-lg"
                  onChange={(event) =>
                    setSuggestions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, location: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Ort"
                  value={suggestion.location}
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
              onClick={() =>
                setSuggestions((current) => [...current, { date: todayKey, time: "", location: "" }])
              }
              type="button"
            >
              + Terminvorschlag
            </button>
          </div>
        )}
        <select
          className="select select-bordered min-h-11 w-full rounded-lg"
          onChange={(event) => setHomeAway(event.target.value as "home" | "away" | "unknown")}
          value={homeAway}
        >
          <option value="unknown">Ort offen</option>
          <option value="home">Heimspiel</option>
          <option value="away">Auswärts</option>
        </select>
        <button className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900" type="submit">
          Abstimmung anlegen
        </button>
      </form>
    </section>
  );
}
