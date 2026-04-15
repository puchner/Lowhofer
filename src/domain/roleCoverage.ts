import { CoverageResult, Player, Position } from "./types";
import { canPlayRole, CORE_LINEUP_ROLES, REQUIRED_ROLE_COUNTS } from "./squadRules";

interface RoleSlot {
  id: string;
  position: Position;
}

interface CoverageAssignment {
  slot: RoleSlot;
  player: Player;
}

export function buildRoleCoverage(availablePlayers: Player[], maybePlayers: Player[]): CoverageResult[] {
  const slots = buildRoleSlots(CORE_LINEUP_ROLES);
  const bestAssignment = findBestCoverageAssignment(availablePlayers, slots);

  return Object.values(Position).map((position) => {
    const assignedPlayers = bestAssignment
      .filter((assignment) => assignment.slot.position === position)
      .map((assignment) => assignment.player);
    const maybeForPosition = maybePlayers.filter((player) => canPlayRole(player, position));
    const required = REQUIRED_ROLE_COUNTS[position] ?? 0;

    return {
      position,
      required,
      availablePlayers: assignedPlayers,
      candidates: [...assignedPlayers, ...maybeForPosition],
      isCovered: assignedPlayers.length >= required,
      isCritical: required > 0 && assignedPlayers.length < required + 1,
    };
  });
}

function findBestCoverageAssignment(players: Player[], slots: RoleSlot[]): CoverageAssignment[] {
  const sortedSlots = [...slots].sort((left, right) => countCandidates(players, left.position) - countCandidates(players, right.position));

  return backtrackBestAssignment(sortedSlots, players, 0, new Set(), [], []);
}

function backtrackBestAssignment(
  slots: RoleSlot[],
  players: Player[],
  slotIndex: number,
  usedPlayerIds: Set<string>,
  current: CoverageAssignment[],
  best: CoverageAssignment[],
): CoverageAssignment[] {
  if (slotIndex >= slots.length) {
    return preferAssignment(current, best);
  }

  if (current.length + (slots.length - slotIndex) < best.length) {
    return best;
  }

  const slot = slots[slotIndex];
  let nextBest = best;
  const candidates = players
    .filter((player) => !usedPlayerIds.has(player.id) && canPlayRole(player, slot.position))
    .sort(preferPrimaryRole(slot.position));

  for (const candidate of candidates) {
    usedPlayerIds.add(candidate.id);
    nextBest = backtrackBestAssignment(
      slots,
      players,
      slotIndex + 1,
      usedPlayerIds,
      [...current, { slot, player: candidate }],
      nextBest,
    );
    usedPlayerIds.delete(candidate.id);
  }

  return backtrackBestAssignment(slots, players, slotIndex + 1, usedPlayerIds, current, nextBest);
}

function preferAssignment(candidate: CoverageAssignment[], currentBest: CoverageAssignment[]): CoverageAssignment[] {
  if (candidate.length !== currentBest.length) {
    return candidate.length > currentBest.length ? candidate : currentBest;
  }

  return assignmentScore(candidate) > assignmentScore(currentBest) ? candidate : currentBest;
}

function assignmentScore(assignments: CoverageAssignment[]): number {
  return assignments.reduce((score, assignment) => {
    if (assignment.player.primaryPosition === assignment.slot.position) {
      return score + 2;
    }

    return score + 1;
  }, 0);
}

function buildRoleSlots(roles: Position[]): RoleSlot[] {
  const counts = new Map<Position, number>();

  return roles.map((position) => {
    const nextCount = (counts.get(position) ?? 0) + 1;
    counts.set(position, nextCount);

    return {
      id: `${position}-${nextCount}`,
      position,
    };
  });
}

function countCandidates(players: Player[], position: Position): number {
  return players.filter((player) => canPlayRole(player, position)).length;
}

function preferPrimaryRole(position: Position) {
  return (left: Player, right: Player) => {
    const leftPrimary = left.primaryPosition === position ? -1 : 0;
    const rightPrimary = right.primaryPosition === position ? -1 : 0;

    return leftPrimary - rightPrimary || left.name.localeCompare(right.name);
  };
}
