import { Gender, LineupSlot, Player, Position, RuleCheckResult } from "./types";

export const MINIMUM_PLAYERS = 6;
export const MIXED_MINIMUM_FEMALE_COURT_PLAYERS = 2;

export const CORE_LINEUP_ROLES: Position[] = [
  Position.Setter,
  Position.Outside,
  Position.Outside,
  Position.Middle,
  Position.Middle,
  Position.Opposite,
];

export const REQUIRED_ROLE_COUNTS = CORE_LINEUP_ROLES.reduce(
  (counts, position) => ({
    ...counts,
    [position]: (counts[position] ?? 0) + 1,
  }),
  {} as Partial<Record<Position, number>>,
);

export function countsAsFemaleForMixedRule(slot: LineupSlot): boolean {
  if (slot.role === Position.Libero) {
    return false;
  }

  return slot.player.gender === Gender.Female;
}

export function checkMinimumPlayers(playerCount: number): RuleCheckResult {
  const passed = playerCount >= MINIMUM_PLAYERS;

  return {
    rule: "Mindestbesetzung",
    passed,
    severity: passed ? "ok" : "error",
    message: passed
      ? "Mindestens sechs Zusagen sind vorhanden."
      : `Es fehlen noch ${MINIMUM_PLAYERS - playerCount} Zusage(n) bis zur Mindestbesetzung.`,
  };
}

export function checkMixedRule(lineup: LineupSlot[] | null): RuleCheckResult {
  const femaleCourtPlayers = lineup?.filter(countsAsFemaleForMixedRule).length ?? 0;
  const passed = femaleCourtPlayers >= MIXED_MINIMUM_FEMALE_COURT_PLAYERS;

  return {
    rule: "Mixed-Regel",
    passed,
    severity: passed ? "ok" : "error",
    message: passed
      ? "Mindestens zwei Damen können auf Feldrollen eingeplant werden."
      : "Die Damenquote ist kritisch. Eine Libera wird hier standardmäßig nicht voll als Dame gezählt.",
  };
}

export function canPlayRole(player: Player, role: Position): boolean {
  return player.positions.includes(role);
}
