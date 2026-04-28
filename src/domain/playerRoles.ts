import { Player } from "./types";

export type PlayerRole = "member" | "training_member";

export const TRAINING_MEMBER_ROLE: PlayerRole = "training_member";
export const MEMBER_ROLE: PlayerRole = "member";

export function getPlayerRole(player: Pick<Player, "role">): PlayerRole {
  return player.role ?? MEMBER_ROLE;
}

export function isTrainingMemberRole(role: PlayerRole | undefined): boolean {
  return role === TRAINING_MEMBER_ROLE;
}

export function isTrainingMember(player: Pick<Player, "role">): boolean {
  return isTrainingMemberRole(getPlayerRole(player));
}

export function isPlayer(player: Pick<Player, "role">): boolean {
  return !isTrainingMember(player);
}

export function getLoginAccountLabel(player: Pick<Player, "name" | "role">): string {
  return isTrainingMember(player) ? `${player.name} - Nur Lesen` : player.name;
}
