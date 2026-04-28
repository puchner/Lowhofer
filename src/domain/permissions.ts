import { Player } from "./types";
import { isPlayer, PlayerRole } from "./playerRoles";

export interface UserCapabilities {
  isAdmin: boolean;
  role?: PlayerRole | null;
}

export function isAdmin(user: UserCapabilities): boolean {
  return user.isAdmin && isPlayer({ role: user.role ?? undefined });
}

export function canRespondToMatch(user: UserCapabilities): boolean {
  return isPlayer({ role: user.role ?? undefined });
}

export function canEditOwnProfile(user: UserCapabilities): boolean {
  return isPlayer({ role: user.role ?? undefined });
}

export function canManageMatches(user: UserCapabilities): boolean {
  return isAdmin(user);
}

export function canManagePlayers(user: UserCapabilities): boolean {
  return isAdmin(user);
}

export function canManageLeagueSource(user: UserCapabilities): boolean {
  return isAdmin(user);
}

export function canGrantAdminRights(user: UserCapabilities): boolean {
  return isAdmin(user);
}

export function canPlayerBeAdmin(player: Pick<Player, "role">): boolean {
  return isPlayer(player);
}
