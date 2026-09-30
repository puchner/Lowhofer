import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deletePlayer, fetchPlayer, UpdateProfileInput, updatePlayer } from "../api/profileApi";
import { PlayerProfileForm } from "../components/players/PlayerProfileForm";
import { canManagePlayers } from "../domain/permissions";
import { Player } from "../domain/types";
import { useCurrentUserCapabilities } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function EditPlayerPage() {
  const { playerId = "" } = useParams();
  const navigate = useNavigate();
  const planner = usePlanner();
  const canEditPlayers = canManagePlayers(useCurrentUserCapabilities());
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!canEditPlayers) {
      setIsLoading(false);
      return () => { active = false; };
    }
    setIsLoading(true);
    fetchPlayer(playerId)
      .then((result) => { if (active) setPlayer(result); })
      .catch(() => { if (active) setError("Spielerprofil konnte nicht geladen werden."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [canEditPlayers, playerId]);

  async function handleSave(input: UpdateProfileInput) {
    const updated = await updatePlayer(playerId, input);
    setPlayer(updated);
    await planner.refresh();
    return updated;
  }

  async function handleDelete(target: Player) {
    await deletePlayer(target.id);
    await planner.refresh();
    navigate("/players", { replace: true });
  }

  if (!canEditPlayers) {
    return (
      <section className="rounded-lg border border-warning/40 bg-warning/10 p-4">
        <h2 className="text-xl font-bold text-petrol-900">Admin-Funktion</h2>
        <p className="mt-2 text-sm text-base-content/70">Nur Admins können andere Spieler bearbeiten.</p>
        <Link className="link link-primary mt-3 inline-block text-sm" to="/players">Zur Spielerliste</Link>
      </section>
    );
  }
  if (isLoading) return <p className="font-semibold text-base-content/70">Spielerprofil wird geladen...</p>;
  if (error || !player) return <p className="font-semibold text-error">{error ?? "Spielerprofil nicht gefunden."}</p>;

  return <PlayerProfileForm initialPlayer={player} mode="edit" onDelete={handleDelete} onSave={handleSave} />;
}
