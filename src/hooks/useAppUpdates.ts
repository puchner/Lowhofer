import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchUpdateState, markUpdatesSeen } from "../api/updatesApi";
import { appUpdates } from "../content/appUpdates";
import { canEditOwnProfile } from "../domain/permissions";
import { useCurrentUserCapabilities, useSession } from "../session/sessionStore";

const initialLastSeenUpdateAt = "1970-01-01T00:00:00.000Z";

export function useAppUpdates() {
  const session = useSession();
  const currentUser = useCurrentUserCapabilities();
  const requestIdRef = useRef(0);
  const [lastSeenUpdateAt, setLastSeenUpdateAt] = useState(initialLastSeenUpdateAt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPersistUpdateState = canEditOwnProfile(currentUser);

  const latestPublishedAt = useMemo(() => {
    const latestTime = appUpdates.reduce((latest, update) => {
      const publishedTime = new Date(update.publishedAt).getTime();

      return Number.isNaN(publishedTime) ? latest : Math.max(latest, publishedTime);
    }, new Date(initialLastSeenUpdateAt).getTime());

    return new Date(latestTime).toISOString();
  }, []);

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!session.isAuthenticated || !session.selectedPlayerId || !canPersistUpdateState) {
      setLastSeenUpdateAt(initialLastSeenUpdateAt);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchUpdateState()
      .then((state) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setLastSeenUpdateAt(state?.lastSeenUpdateAt ?? initialLastSeenUpdateAt);
      })
      .catch((fetchError: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Update-Status konnte nicht geladen werden.");
        setLastSeenUpdateAt(initialLastSeenUpdateAt);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [canPersistUpdateState, session.isAuthenticated, session.selectedPlayerId]);

  const unreadUpdates = useMemo(() => {
    const lastSeenTime = new Date(lastSeenUpdateAt).getTime();

    if (Number.isNaN(lastSeenTime) || !session.isAuthenticated || !session.selectedPlayerId || !canPersistUpdateState) {
      return [];
    }

    return appUpdates.filter((update) => new Date(update.publishedAt).getTime() > lastSeenTime);
  }, [canPersistUpdateState, lastSeenUpdateAt, session.isAuthenticated, session.selectedPlayerId]);

  const markAllAsSeen = useCallback(async () => {
    if (appUpdates.length === 0) {
      return;
    }

    const previousLastSeenUpdateAt = lastSeenUpdateAt;
    setLastSeenUpdateAt(latestPublishedAt);

    if (!session.isAuthenticated || !session.selectedPlayerId || !canPersistUpdateState) {
      return;
    }

    try {
      setError(null);
      const state = await markUpdatesSeen(latestPublishedAt);
      setLastSeenUpdateAt(state?.lastSeenUpdateAt ?? latestPublishedAt);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Update-Status konnte nicht gespeichert werden.");
      setLastSeenUpdateAt(previousLastSeenUpdateAt);
    }
  }, [canPersistUpdateState, lastSeenUpdateAt, latestPublishedAt, session.isAuthenticated, session.selectedPlayerId]);

  return {
    allUpdates: appUpdates,
    unreadUpdates,
    unreadCount: unreadUpdates.length,
    lastSeenUpdateAt,
    isLoading,
    error,
    markAllAsSeen,
  };
}
