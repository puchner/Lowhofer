import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Ambulance, Ban, Plane } from "lucide-react";
import type { UpdateProfileInput } from "../../api/profileApi";
import { PlayerAvatar } from "./PlayerAvatar";
import {
  defaultFemaleAvatar,
  defaultMaleAvatar,
  generatedAvatarOptions,
  generatedAvatarStyleGroups,
  type GeneratedAvatarOption,
} from "../../domain/avatarOptions";
import { genderLabel } from "../../domain/labels";
import { Gender, Player, Position, TemporaryUnavailabilityReason } from "../../domain/types";

const allPositions = Object.values(Position);
const allGenders = Object.values(Gender);

const unavailabilityOptions: Array<{
  value: TemporaryUnavailabilityReason;
  label: string;
  Icon: typeof Ambulance;
}> = [
  { value: "illness_injury", label: "Verletzung/Krankheit", Icon: Ambulance },
  { value: "travel", label: "Reise", Icon: Plane },
  { value: "other", label: "Sonstiges", Icon: Ban },
];

interface PlayerProfileFormProps {
  initialPlayer: Player;
  mode: "create" | "edit";
  onSave: (input: UpdateProfileInput) => Promise<Player>;
  onDelete?: (player: Player) => Promise<void>;
}

export function PlayerProfileForm({ initialPlayer, mode, onSave, onDelete }: PlayerProfileFormProps) {
  const [profile, setProfile] = useState(initialPlayer);
  const [displayName, setDisplayName] = useState(initialPlayer.name);
  const [gender, setGender] = useState(initialPlayer.gender);
  const [positions, setPositions] = useState(initialPlayer.positions);
  const [primaryPosition, setPrimaryPosition] = useState<Position | "">(initialPlayer.primaryPosition ?? "");
  const initialAvatar = getAvatarOption(initialPlayer);
  const [avatar, setAvatar] = useState<GeneratedAvatarOption>(initialAvatar);
  const [activeAvatarStyle, setActiveAvatarStyle] = useState(initialAvatar.style);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempUnavailableReason, setTempUnavailableReason] = useState<TemporaryUnavailabilityReason | null>(
    initialPlayer.tempUnavailableReason ?? null,
  );
  const [tempUnavailableNote, setTempUnavailableNote] = useState(initialPlayer.tempUnavailableNote ?? "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isCreating = mode === "create";

  const previewPlayer = useMemo<Player>(
    () => ({
      id: profile.id,
      name: displayName || "Lowhofer",
      gender,
      positions,
      primaryPosition: primaryPosition || positions[0],
      avatar: { kind: "generated", style: avatar.style, seed: avatar.seed },
    }),
    [avatar.seed, avatar.style, displayName, gender, positions, primaryPosition, profile.id],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!primaryPosition || positions.length === 0) {
      setError("Wähle mindestens eine Position und eine Hauptposition.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedPlayer = await onSave({
        displayName,
        gender,
        positions,
        primaryPosition,
        avatar: { kind: "generated", style: avatar.style, seed: avatar.seed },
        tempUnavailableReason,
        tempUnavailableNote: tempUnavailableReason ? tempUnavailableNote.trim() : "",
      });
      applyPlayer(updatedPlayer);
      setMessage(isCreating ? "Spieler angelegt." : "Profil gespeichert.");
    } catch (nextError) {
      setError(getProfileErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  }

  function handlePositionChange(position: Position, checked: boolean) {
    setPositions((currentPositions) => {
      const nextPositions = checked
        ? [...currentPositions, position]
        : currentPositions.filter((currentPosition) => currentPosition !== position);

      if (!nextPositions.includes(primaryPosition as Position)) {
        setPrimaryPosition(nextPositions[0] ?? "");
      }

      return nextPositions;
    });
  }

  function applyPlayer(nextPlayer: Player) {
    const nextAvatar = getAvatarOption(nextPlayer);
    setProfile(nextPlayer);
    setDisplayName(nextPlayer.name);
    setGender(nextPlayer.gender);
    setPositions(nextPlayer.positions);
    setPrimaryPosition(nextPlayer.primaryPosition ?? nextPlayer.positions[0] ?? "");
    setAvatar(nextAvatar);
    setActiveAvatarStyle(nextAvatar.style);
    setTempUnavailableReason(nextPlayer.tempUnavailableReason ?? null);
    setTempUnavailableNote(nextPlayer.tempUnavailableNote ?? "");
  }

  const activeAvatarGroup =
    generatedAvatarStyleGroups.find((group) => group.style === activeAvatarStyle) ?? generatedAvatarStyleGroups[0];

  return (
    <section className="space-y-5">
      <div>
        <Link className="link link-primary text-sm" to="/players">
          Zurück zur Spielerliste
        </Link>
        <p className="text-sm font-semibold uppercase text-primary">{isCreating ? "Spielerverwaltung" : "Mein Profil"}</p>
        <h2 className="text-3xl font-bold text-petrol-900">{isCreating ? "Spieler hinzufügen" : "Spieler bearbeiten"}</h2>
        {!isCreating ? (
          <p className="mt-2 max-w-2xl text-base-content/70">
            Diese Angaben sehen deine Mitspieler in Kader, Spieltagen und Rückmeldungen.
          </p>
        ) : null}
      </div>

      <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-lg font-bold text-petrol-900">Stammdaten</h3>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-base-content/70">Anzeigename</span>
              <input
                autoFocus={isCreating}
                className="input input-bordered mt-1 min-h-12 w-full rounded-lg"
                maxLength={80}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>

            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-base-content/70">Geschlecht</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {allGenders.map((genderOption) => (
                  <label
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-primary/15 bg-base-200 px-3 font-semibold"
                    key={genderOption}
                  >
                    <input
                      checked={gender === genderOption}
                      className="radio radio-primary radio-sm"
                      name="gender"
                      onChange={() => setGender(genderOption)}
                      type="radio"
                    />
                    {genderLabel[genderOption]}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-lg font-bold text-petrol-900">Positionen</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {allPositions.map((position) => (
                <label
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-primary/15 bg-base-200 px-3 font-semibold"
                  key={position}
                >
                  <input
                    checked={positions.includes(position)}
                    className="checkbox checkbox-primary checkbox-sm"
                    onChange={(event) => handlePositionChange(position, event.target.checked)}
                    type="checkbox"
                  />
                  {position}
                </label>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-base-content/70">Hauptposition</span>
              <select
                className="select select-bordered mt-1 min-h-12 w-full rounded-lg"
                disabled={positions.length === 0}
                onChange={(event) => setPrimaryPosition(event.target.value as Position)}
                required
                value={primaryPosition}
              >
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-lg font-bold text-petrol-900">Avatar</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {generatedAvatarStyleGroups.map((group) => (
                <button
                  className={`btn btn-sm min-h-9 rounded-lg px-3 ${
                    group.style === activeAvatarGroup.style ? "btn-secondary text-petrol-900" : "border-primary/15 bg-base-200"
                  }`}
                  key={group.style}
                  onClick={() => setActiveAvatarStyle(group.style)}
                  type="button"
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {activeAvatarGroup.options.map((option) => {
                const isSelected = option.style === avatar.style && option.seed === avatar.seed;
                const avatarPlayer: Player = { ...previewPlayer, avatar: { kind: "generated", style: option.style, seed: option.seed } };

                return (
                  <button
                    aria-label={`Avatar ${option.label} auswählen`}
                    className={`flex aspect-square items-center justify-center rounded-lg border bg-base-200 transition ${
                      isSelected ? "border-secondary ring-2 ring-secondary" : "border-primary/15 hover:border-primary/40"
                    }`}
                    key={`${option.style}-${option.seed}`}
                    onClick={() => setAvatar(option)}
                    type="button"
                  >
                    <PlayerAvatar player={avatarPlayer} size="lg" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-lg font-bold text-petrol-900">Vorschau</h3>
            <div className="mt-4 flex items-center gap-3">
              <PlayerAvatar player={previewPlayer} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-petrol-900">{displayName || "Lowhofer"}</p>
                <p className="text-sm text-base-content/60">{primaryPosition || "Position offen"}</p>
              </div>
            </div>
          </section>

          {error ? <p className="rounded-lg bg-error/10 p-3 text-sm font-semibold text-error">{error}</p> : null}
          {message ? <p className="rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{message}</p> : null}

          <button
            className="btn btn-secondary min-h-12 w-full rounded-lg text-petrol-900"
            disabled={isSaving || !displayName.trim() || positions.length === 0 || !primaryPosition}
            type="submit"
          >
            {isSaving ? "Speichere..." : isCreating ? "Spieler anlegen" : "Profil speichern"}
          </button>
        </aside>
      </form>
      {!isCreating ? (
        <section className="rounded-lg border border-warning/35 bg-warning/5 p-4 shadow-sm">
          <h3 className="text-lg font-bold text-petrol-900">Vorübergehende Abwesenheit</h3>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
            <input
              checked={tempUnavailableReason !== null}
              className="checkbox checkbox-warning mt-0.5"
              onChange={(event) =>
                setTempUnavailableReason((current) => event.target.checked ? current ?? "other" : null)
              }
              type="checkbox"
            />
            <span className="font-semibold text-base-content">Ich bin zeitweise nicht verfügbar</span>
          </label>
          {tempUnavailableReason !== null ? (
            <>
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold text-base-content/70">Grund der Abwesenheit</legend>
                <div className="join join-vertical mt-2 w-full sm:join-horizontal">
                  {unavailabilityOptions.map(({ Icon, label, value }) => (
                    <label
                      className={`join-item btn h-auto min-h-12 flex-1 justify-start gap-2 whitespace-normal px-3 text-left ${
                        tempUnavailableReason === value
                          ? "btn-warning text-petrol-900"
                          : "border-primary/20 bg-base-100 text-base-content"
                      }`}
                      key={value}
                    >
                      <input
                        checked={tempUnavailableReason === value}
                        className="radio radio-primary radio-sm"
                        name="temp-unavailable-reason"
                        onChange={() => setTempUnavailableReason(value)}
                        type="radio"
                        value={value}
                      />
                      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="mt-3 block">
                <span className="text-sm font-semibold text-base-content/70">Hinweis für die Mannschaft (optional)</span>
                <textarea
                  className="textarea textarea-bordered mt-1 min-h-20 w-full rounded-lg"
                  maxLength={500}
                  onChange={(event) => setTempUnavailableNote(event.target.value)}
                  value={tempUnavailableNote}
                />
              </label>
            </>
          ) : null}
        </section>
      ) : null}
      {onDelete && !isCreating ? (
        <section className="rounded-lg border border-error/30 bg-error/5 p-4">
          <h3 className="text-lg font-bold text-error">Spieler dauerhaft löschen</h3>
          <p className="mt-1 text-sm text-base-content/75">
            Das Profil und alle verknüpften Positionen, Rückmeldungen und Profiländerungsdaten werden endgültig gelöscht. Bestehende Termine und Umfragen bleiben erhalten.
          </p>
          <label className="mt-3 block">
            <span className="text-sm font-semibold text-base-content/70">
              Zur Bestätigung den Namen „{profile.name}“ eingeben
            </span>
            <input
              className="input input-bordered mt-1 min-h-11 w-full rounded-lg"
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              value={deleteConfirmation}
            />
          </label>
          <button
            className="btn btn-error mt-3 min-h-11 rounded-lg"
            disabled={isDeleting || deleteConfirmation.trim() !== profile.name}
            onClick={async () => {
              setError(null);
              setIsDeleting(true);
              try {
                await onDelete(profile);
              } catch (deleteError) {
                setError(getProfileErrorMessage(deleteError));
                setIsDeleting(false);
              }
            }}
            type="button"
          >
            {isDeleting ? "Lösche..." : "Spieler endgültig löschen"}
          </button>
        </section>
      ) : null}
    </section>
  );
}

function getProfileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "display_name_already_exists") {
    return "Name schon vergeben.";
  }
  if (error instanceof Error && error.message === "cannot_delete_own_account") {
    return "Das eigene Profil kann nicht gelöscht werden.";
  }
  if (error instanceof Error && error.message === "last_admin_cannot_be_deleted") {
    return "Der letzte aktive Admin kann nicht gelöscht werden.";
  }

  return "Profil konnte nicht gespeichert werden.";
}

function getAvatarOption(player: Player): GeneratedAvatarOption {
  if (player.avatar?.kind === "generated" && player.avatar.style && player.avatar.seed) {
    return generatedAvatarOptions.find((option) => option.style === player.avatar?.style && option.seed === player.avatar?.seed) ??
      getFallbackAvatarOption(player.gender);
  }

  return getFallbackAvatarOption(player.gender);
}

function getFallbackAvatarOption(gender: Gender): GeneratedAvatarOption {
  return gender === Gender.Male ? defaultMaleAvatar : defaultFemaleAvatar;
}
