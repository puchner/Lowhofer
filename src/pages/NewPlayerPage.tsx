import { Link, useNavigate } from "react-router-dom";
import { createPlayer, UpdateProfileInput } from "../api/profileApi";
import { PlayerProfileForm } from "../components/players/PlayerProfileForm";
import { defaultFemaleAvatar } from "../domain/avatarOptions";
import { canManagePlayers } from "../domain/permissions";
import { Gender, Player } from "../domain/types";
import { useCurrentUserCapabilities, useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function NewPlayerPage() {
  const navigate = useNavigate();
  const session = useSession();
  const planner = usePlanner();
  const canCreatePlayer = canManagePlayers(useCurrentUserCapabilities());

  async function handleCreate(input: UpdateProfileInput): Promise<Player> {
    const player = await createPlayer(input);
    await Promise.allSettled([session.refresh(), planner.refresh()]);
    navigate("/players", { state: { focusPlayerId: player.id } });
    return player;
  }

  if (!canCreatePlayer) {
    return (
      <section className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <h2 className="text-xl font-bold text-petrol-900">Admin-Funktion</h2>
        <p className="mt-2 text-sm text-base-content/70">Nur Admins können Spieler hinzufügen.</p>
        <Link className="link link-primary mt-3 inline-block text-sm" to="/players">
          Zur Spielerliste
        </Link>
      </section>
    );
  }

  return <PlayerProfileForm initialPlayer={newPlayerDraft} mode="create" onSave={handleCreate} />;
}

const newPlayerDraft: Player = {
  id: "new-player-draft",
  name: "",
  gender: Gender.Female,
  positions: [],
  avatar: {
    kind: "generated",
    style: defaultFemaleAvatar.style,
    seed: defaultFemaleAvatar.seed,
  },
};
