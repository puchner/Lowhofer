import {
  AvailabilityStatus,
  CoverageResult,
  Gender,
  MatchDay,
  Player,
  SquadAnalysis,
} from "./types";
import {
  checkMinimumPlayers,
  checkMixedRule,
  MIXED_MINIMUM_FEMALE_COURT_PLAYERS,
} from "./squadRules";
import { findPossibleLineup } from "./lineup";
import { buildRoleCoverage } from "./roleCoverage";

export function analyzeMatchDay(matchDay: MatchDay, players: Player[]): SquadAnalysis {
  const availablePlayers = playersForStatus(matchDay, players, AvailabilityStatus.Available);
  const maybePlayers = playersForStatus(matchDay, players, AvailabilityStatus.Maybe);
  const coverage = buildRoleCoverage(availablePlayers, maybePlayers);
  const possibleLineup = findPossibleLineup(availablePlayers);
  const mixedRuleLineup = findPossibleLineup(availablePlayers, undefined, {
    minFemaleCourtPlayers: MIXED_MINIMUM_FEMALE_COURT_PLAYERS,
  });
  const minimumPlayersCheck = checkMinimumPlayers(availablePlayers.length);
  const mixedRuleCheck = checkMixedRule(mixedRuleLineup);
  const missingPositions = coverage
    .filter((result) => result.required > 0 && !result.isCovered)
    .map((result) => result.position);
  const criticalPositions = coverage.filter((result) => result.isCritical);
  const maleAvailableCount = countAvailableMen(availablePlayers);
  const warnings = buildWarnings(
    minimumPlayersCheck,
    mixedRuleCheck,
    criticalPositions,
    maleAvailableCount,
  );

  return {
    matchDayId: matchDay.id,
    availableCount: availablePlayers.length,
    maybeCount: maybePlayers.length,
    coveredPositions: coverage.filter((result) => result.required > 0 && result.isCovered).map((result) => result.position),
    missingPositions,
    criticalPositions,
    coverage,
    minimumPlayersCheck,
    mixedRuleCheck,
    possibleLineup,
    flexiblePlayers: availablePlayers.filter((player) => player.positions.length >= 3),
    warnings,
    status: determineStatus(
      Boolean(possibleLineup),
      minimumPlayersCheck.passed,
      mixedRuleCheck.passed,
      maleAvailableCount,
    ),
  };
}

function playersForStatus(
  matchDay: MatchDay,
  players: Player[],
  status: AvailabilityStatus,
): Player[] {
  const playerIds = new Set(
    matchDay.availability
      .filter((availability) => availability.status === status)
      .map((availability) => availability.playerId),
  );

  return players.filter((player) => playerIds.has(player.id));
}

function determineStatus(
  hasPossibleLineup: boolean,
  minimumPlayersPassed: boolean,
  mixedRulePassed: boolean,
  maleAvailableCount: number,
): SquadAnalysis["status"] {
  if (!minimumPlayersPassed) {
    return "not-playable";
  }

  if (maleAvailableCount < 4) {
    return "ladies-night";
  }

  if (hasPossibleLineup && minimumPlayersPassed && mixedRulePassed) {
    return "playable";
  }

  if (hasPossibleLineup) {
    return "critical";
  }

  return "critical";
}

function buildWarnings(
  minimumPlayersCheck: SquadAnalysis["minimumPlayersCheck"],
  mixedRuleCheck: SquadAnalysis["mixedRuleCheck"],
  criticalPositions: CoverageResult[],
  maleAvailableCount: number,
): string[] {
  return [
    minimumPlayersCheck.passed ? undefined : minimumPlayersCheck.message,
    minimumPlayersCheck.passed && maleAvailableCount < 4
      ? `Ladies Night: Nur ${maleAvailableCount} Herr(en) haben zugesagt.`
      : undefined,
    mixedRuleCheck.passed ? undefined : mixedRuleCheck.message,
    criticalPositions.length > 0
      ? `Kritisch: ${criticalPositions.map((result) => result.position).join(", ")}.`
      : undefined,
  ].filter(Boolean) as string[];
}

function countAvailableMen(players: Player[]): number {
  return players.filter((player) => player.gender === Gender.Male).length;
}
