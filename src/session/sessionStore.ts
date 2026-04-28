import { createContext, useContext, useMemo } from "react";
import { UserCapabilities } from "../domain/permissions";
import { SessionContextValue } from "./sessionTypes";

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return value;
}

export function useCurrentUserCapabilities(): UserCapabilities {
  const session = useSession();

  return useMemo(
    () => ({
      isAdmin: session.selectedPlayerIsAdmin,
      role: session.selectedPlayerRole,
    }),
    [session.selectedPlayerIsAdmin, session.selectedPlayerRole],
  );
}
