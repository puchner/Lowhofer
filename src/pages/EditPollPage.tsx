import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PollType } from "../domain/types";
import { useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function EditPollPage() {
  const navigate = useNavigate();
  const { matchDayId } = useParams();
  const { matchDays, updatePoll } = usePlanner();
  const { selectedPlayerIsAdmin } = useSession();
  const matchDay = useMemo(() => matchDays.find((item) => item.id === matchDayId), [matchDayId, matchDays]);
  const [title, setTitle] = useState(matchDay?.title ?? "");
  const [opponent, setOpponent] = useState(matchDay?.opponent ?? "");
  const [time, setTime] = useState(matchDay?.time ?? "");
  const [type, setType] = useState<PollType>(matchDay?.type ?? "date-finding");
  const [homeAway, setHomeAway] = useState<"home" | "away" | "unknown">(matchDay?.homeAway ?? "unknown");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!matchDay) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updatePoll({
        pollId: matchDay.id,
        title: title.trim() || opponent.trim(),
        type,
        date: matchDay.date,
        time: time || undefined,
        opponent: opponent.trim() || "Offen",
        homeAway,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
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
        <Link className="btn btn-primary rounded-lg" to="/">
          Zurück zum Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <Link className="link link-primary text-sm" to="/">
          Zurück
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase text-primary sm:text-sm">Bearbeiten</p>
        <h2 className="text-2xl font-bold text-petrol-900 sm:text-3xl">Abstimmung bearbeiten</h2>
      </div>

      <form className="space-y-3 rounded-lg border border-primary/15 bg-base-100 p-3 shadow-sm sm:p-4" onSubmit={handleSubmit}>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-base-content/60">Datum bleibt unverändert</span>
            <input
              className="input input-bordered min-h-11 w-full rounded-lg bg-base-200 text-base-content/70"
              disabled
              type="date"
              value={matchDay.date}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-base-content/60">Uhrzeit</span>
            <input
              className="input input-bordered min-h-11 w-full rounded-lg"
              onChange={(event) => setTime(event.target.value)}
              type="time"
              value={time}
            />
          </label>
        </div>
        <select
          className="select select-bordered min-h-11 w-full rounded-lg"
          onChange={(event) => setHomeAway(event.target.value as "home" | "away" | "unknown")}
          value={homeAway}
        >
          <option value="unknown">Ort offen</option>
          <option value="home">Heimspiel</option>
          <option value="away">Auswärts</option>
        </select>
        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
        <button className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900" disabled={isSaving} type="submit">
          {isSaving ? "Wird gespeichert..." : "Änderungen speichern"}
        </button>
      </form>
    </section>
  );
}
