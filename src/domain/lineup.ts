import { Gender, LineupSlot, Player, Position } from "./types";
import { canPlayRole, CORE_LINEUP_ROLES, countsAsFemaleForMixedRule } from "./squadRules";

interface FindLineupOptions {
  minFemaleCourtPlayers?: number;
}

export function findPossibleLineup(
  players: Player[],
  roles: Position[] = CORE_LINEUP_ROLES,
  options: FindLineupOptions = {},
): LineupSlot[] | null {
  const sortedRoles = [...roles].sort(
    (a, b) => countCandidates(players, a) - countCandidates(players, b),
  );

  return backtrack(sortedRoles, players, [], new Set(), options);
}

export function getMaxFemaleCourtPlayers(
  players: Player[],
  roles: Position[] = CORE_LINEUP_ROLES,
): number {
  for (let femaleCount = roles.length; femaleCount >= 0; femaleCount -= 1) {
    if (findPossibleLineup(players, roles, { minFemaleCourtPlayers: femaleCount })) {
      return femaleCount;
    }
  }

  return 0;
}

function backtrack(
  roles: Position[],
  players: Player[],
  lineup: LineupSlot[],
  usedPlayerIds: Set<string>,
  options: FindLineupOptions,
): LineupSlot[] | null {
  if (lineup.length === roles.length) {
    const femaleCourtPlayers = lineup.filter(countsAsFemaleForMixedRule).length;

    if (
      options.minFemaleCourtPlayers === undefined ||
      femaleCourtPlayers >= options.minFemaleCourtPlayers
    ) {
      return lineup;
    }

    return null;
  }

  const role = roles[lineup.length];
  const candidates = players
    .filter((player) => !usedPlayerIds.has(player.id) && canPlayRole(player, role))
    .sort(preferPrimaryRole(role));

  for (const candidate of candidates) {
    usedPlayerIds.add(candidate.id);
    const result = backtrack(
      roles,
      players,
      [...lineup, { role, player: candidate }],
      usedPlayerIds,
      options,
    );

    if (result) {
      return result;
    }

    usedPlayerIds.delete(candidate.id);
  }

  return null;
}

function countCandidates(players: Player[], role: Position): number {
  return players.filter((player) => canPlayRole(player, role)).length;
}

function preferPrimaryRole(role: Position) {
  return (a: Player, b: Player) => {
    const aPrimary = a.primaryPosition === role ? -1 : 0;
    const bPrimary = b.primaryPosition === role ? -1 : 0;
    const aFemale = a.gender === Gender.Female ? -0.25 : 0;
    const bFemale = b.gender === Gender.Female ? -0.25 : 0;

    return aPrimary + aFemale - (bPrimary + bFemale);
  };
}
