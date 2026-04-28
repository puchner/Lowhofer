import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfile, updateProfile } from "../api/profileApi";
import { PlayerAvatar } from "../components/players/PlayerAvatar";
import {
  defaultFemaleAvatar,
  defaultMaleAvatar,
  generatedAvatarOptions,
  generatedAvatarStyleGroups,
  type GeneratedAvatarOption,
} from "../domain/avatarOptions";
import { genderLabel } from "../domain/labels";
import { canEditOwnProfile } from "../domain/permissions";
import { Gender, Player, Position } from "../domain/types";
import { useCurrentUserCapabilities, useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

const allPositions = Object.values(Position);
const allGenders = Object.values(Gender);

export function ProfilePage() {
  const session = useSession();
  const currentUser = useCurrentUserCapabilities();
  const planner = usePlanner();
  const [profile, setProfile] = useState<Player | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.Female);
  const [positions, setPositions] = useState<Position[]>([]);
  const [primaryPosition, setPrimaryPosition] = useState<Position | "">("");
  const [avatar, setAvatar] = useState<GeneratedAvatarOption>(generatedAvatarOptions[0]);
  const [activeAvatarStyle, setActiveAvatarStyle] = useState(generatedAvatarStyleGroups[0].style);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEditProfile = canEditOwnProfile(currentUser);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    if (!canEditProfile) {
      setIsLoading(false);
      return;
    }

    fetchProfile()
      .then((nextProfile) => {
        if (!isMounted) {
          return;
        }

        applyProfile(nextProfile);
      })
      .catch(() => {
        if (isMounted) {
          setError("Profil konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canEditProfile]);

  const previewPlayer = useMemo<Player>(
    () => ({
      id: profile?.id ?? session.selectedPlayerId ?? "preview",
      name: displayName || "Lowhofer",
      gender,
      positions,
      primaryPosition: primaryPosition || positions[0],
      avatar: {
        kind: "generated",
        style: avatar.style,
        seed: avatar.seed,
      },
    }),
    [avatar.seed, avatar.style, displayName, gender, positions, primaryPosition, profile?.id, session.selectedPlayerId],
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
      const updatedProfile = await updateProfile({
        displayName,
        gender,
        positions,
        primaryPosition,
        avatar: {
          kind: "generated",
          style: avatar.style,
          seed: avatar.seed,
        },
      });

      applyProfile(updatedProfile);
      await Promise.all([session.refresh(), planner.refresh()]);
      setMessage("Profil gespeichert.");
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

  function applyProfile(nextProfile: Player) {
    const nextAvatar =
      nextProfile.avatar?.kind === "generated" && nextProfile.avatar.style && nextProfile.avatar.seed
        ? getConfiguredAvatarOption(nextProfile.avatar.style, nextProfile.avatar.seed, nextProfile.gender)
        : getFallbackAvatarOption(nextProfile.gender);

    setProfile(nextProfile);
    setDisplayName(nextProfile.name);
    setGender(nextProfile.gender);
    setPositions(nextProfile.positions);
    setPrimaryPosition(nextProfile.primaryPosition ?? nextProfile.positions[0] ?? "");
    setAvatar(nextAvatar);
    setActiveAvatarStyle(nextAvatar.style);
  }

  const activeAvatarGroup =
    generatedAvatarStyleGroups.find((group) => group.style === activeAvatarStyle) ?? generatedAvatarStyleGroups[0];

  if (isLoading) {
    return <p className="font-semibold text-base-content/70">Profil wird geladen...</p>;
  }

  if (!canEditProfile) {
    return (
      <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
        <h2 className="text-xl font-bold text-petrol-900">Lowhofer - Nur Lesen</h2>
        <p className="mt-2 text-sm text-base-content/70">
          Dieser Zugang ist kein aktiver Spieler und hat kein bearbeitbares Profil.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <Link className="link link-primary text-sm" to="/players">
          Zurück zur Spielerliste
        </Link>
        <p className="text-sm font-semibold uppercase text-primary">Mein Profil</p>
        <h2 className="text-3xl font-bold text-petrol-900">Spieler bearbeiten</h2>
        <p className="mt-2 max-w-2xl text-base-content/70">
          Diese Angaben sehen deine Mitspieler in Kader, Spieltagen und Rückmeldungen.
        </p>
      </div>

      <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <section className="rounded-lg border border-primary/15 bg-base-100 p-4 shadow-sm">
            <h3 className="text-lg font-bold text-petrol-900">Stammdaten</h3>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-base-content/70">Anzeigename</span>
              <input
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
              <span className="text-sm font-semibold text-base-content/70">Primary Position</span>
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
                    group.style === activeAvatarGroup.style
                      ? "btn-secondary text-petrol-900"
                      : "border-primary/15 bg-base-200"
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
                const avatarPlayer: Player = {
                  ...previewPlayer,
                  avatar: {
                    kind: "generated",
                    style: option.style,
                    seed: option.seed,
                  },
                };

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
            {isSaving ? "Speichere..." : "Profil speichern"}
          </button>
        </aside>
      </form>
    </section>
  );
}

function getProfileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "display_name_already_exists") {
    return "Name schon vergeben.";
  }

  return "Profil konnte nicht gespeichert werden.";
}

function getConfiguredAvatarOption(style: string, seed: string, gender: Gender): GeneratedAvatarOption {
  return (
    generatedAvatarOptions.find((option) => option.style === style && option.seed === seed) ??
    getFallbackAvatarOption(gender)
  );
}

function getFallbackAvatarOption(gender: Gender): GeneratedAvatarOption {
  if (gender === Gender.Male) {
    return defaultMaleAvatar;
  }

  return defaultFemaleAvatar;
}
