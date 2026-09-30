import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile, updateProfile, UpdateProfileInput } from "../api/profileApi";
import { PlayerProfileForm } from "../components/players/PlayerProfileForm";
import { canEditOwnProfile } from "../domain/permissions";
import { Player } from "../domain/types";
import { useCurrentUserCapabilities, useSession } from "../session/sessionStore";
import { usePlanner } from "../state/plannerStore";

export function ProfilePage() {
  const session = useSession();
  const currentUser = useCurrentUserCapabilities();
  const planner = usePlanner();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
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
        if (isMounted) setProfile(nextProfile);
      })
      .catch(() => {
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canEditProfile]);

  async function handleSave(input: UpdateProfileInput) {
    const updatedProfile = await updateProfile(input);
    setProfile(updatedProfile);
    await Promise.allSettled([session.refresh(), planner.refresh()]);
    navigate("/players", { state: { focusPlayerId: updatedProfile.id } });
    return updatedProfile;
  }

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

  if (error || !profile) {
    return <p className="font-semibold text-error">Profil konnte nicht geladen werden.</p>;
  }

  return <PlayerProfileForm initialPlayer={profile} mode="edit" onSave={handleSave} />;
}
