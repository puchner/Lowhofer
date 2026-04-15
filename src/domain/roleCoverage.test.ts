import { describe, expect, it } from "vitest";
import { analyzeMatchDay } from "./analyzeSquad";
import { AvailabilityStatus, Gender, MatchDay, Player, Position } from "./types";

describe("role coverage", () => {
  it("does not double-count flexible players from the 2026-04-20 seed match", () => {
    const analysis = analyzeMatchDay(matchDayWithAvailability(seedPlayers, {
      Pia: AvailabilityStatus.Available,
      Nina: AvailabilityStatus.Available,
      Dani: AvailabilityStatus.Available,
      Caro: AvailabilityStatus.Unavailable,
      Linda: AvailabilityStatus.Available,
      Ina: AvailabilityStatus.Unknown,
      Andi: AvailabilityStatus.Maybe,
      Lars: AvailabilityStatus.Available,
      Stefan: AvailabilityStatus.Unavailable,
      Volker: AvailabilityStatus.Available,
      Michi: AvailabilityStatus.Maybe,
      Fran: AvailabilityStatus.Unknown,
      Heli: AvailabilityStatus.Maybe,
    }), seedPlayers);

    expect(analysis.possibleLineup).toBeNull();
    expect(analysis.missingPositions.some((position) => position === Position.Outside || position === Position.Opposite)).toBe(true);
    expect(analysis.coveredPositions).not.toEqual(
      expect.arrayContaining([Position.Setter, Position.Outside, Position.Middle, Position.Opposite]),
    );
  });

  it("covers every core role when six unique players fit the required lineup", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Outside 1", Gender.Female, [Position.Outside]),
      player("Outside 2", Gender.Male, [Position.Outside]),
      player("Middle 1", Gender.Male, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Opposite", Gender.Male, [Position.Opposite]),
    ];
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.possibleLineup).not.toBeNull();
    expect(analysis.missingPositions).toEqual([]);
    expect(analysis.coveredPositions).toEqual(
      expect.arrayContaining([Position.Setter, Position.Outside, Position.Middle, Position.Opposite]),
    );
  });

  it("reports an outside gap when one outside candidate is needed elsewhere", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Outside only", Gender.Female, [Position.Outside]),
      player("Outside or opposite", Gender.Male, [Position.Outside, Position.Opposite], Position.Opposite),
      player("Middle 1", Gender.Male, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Bench libero", Gender.Male, [Position.Libero]),
    ];
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.possibleLineup).toBeNull();
    expect(analysis.missingPositions).toContain(Position.Outside);
  });

  it("ignores maybe players for confirmed coverage but keeps them as candidates", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Outside 1", Gender.Female, [Position.Outside]),
      player("Outside maybe", Gender.Male, [Position.Outside]),
      player("Middle 1", Gender.Male, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Opposite", Gender.Male, [Position.Opposite]),
    ];
    const analysis = analyzeMatchDay(
      matchDayWithAvailability(players, {
        "Outside maybe": AvailabilityStatus.Maybe,
      }),
      players,
    );
    const outsideCoverage = analysis.coverage.find((result) => result.position === Position.Outside);

    expect(analysis.missingPositions).toContain(Position.Outside);
    expect(outsideCoverage?.availablePlayers.map((availablePlayer) => availablePlayer.name)).toEqual(["Outside 1"]);
    expect(outsideCoverage?.candidates.map((candidate) => candidate.name)).toEqual(["Outside 1", "Outside maybe"]);
  });

  it("marks the match as playable when lineup, minimum players and mixed rule pass", () => {
    const players = validCoreLineupPlayers();
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.status).toBe("playable");
  });

  it("marks the match as ox down when fewer than six players confirmed", () => {
    const players = validCoreLineupPlayers();
    const analysis = analyzeMatchDay(
      matchDayWithAvailability(players, {
        Opposite: AvailabilityStatus.Unavailable,
      }),
      players,
    );

    expect(analysis.status).toBe("not-playable");
  });

  it("marks ladies night when fewer than four men confirmed", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Outside 1", Gender.Female, [Position.Outside]),
      player("Outside 2", Gender.Female, [Position.Outside]),
      player("Middle 1", Gender.Female, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Opposite", Gender.Male, [Position.Opposite]),
    ];
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.status).toBe("ladies-night");
  });

  it("marks a single court woman with at least five men as critical, not ladies night", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Outside 1", Gender.Male, [Position.Outside]),
      player("Outside 2", Gender.Male, [Position.Outside]),
      player("Middle 1", Gender.Male, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Opposite", Gender.Male, [Position.Opposite]),
    ];
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.possibleLineup).not.toBeNull();
    expect(analysis.mixedRuleCheck.passed).toBe(false);
    expect(analysis.status).toBe("critical");
  });

  it("does not count a libero as a full woman for the mixed rule", () => {
    const players = [
      player("Setter", Gender.Female, [Position.Setter]),
      player("Female libero", Gender.Female, [Position.Libero]),
      player("Outside 1", Gender.Male, [Position.Outside]),
      player("Outside 2", Gender.Male, [Position.Outside]),
      player("Middle 1", Gender.Male, [Position.Middle]),
      player("Middle 2", Gender.Male, [Position.Middle]),
      player("Opposite", Gender.Male, [Position.Opposite]),
    ];
    const analysis = analyzeMatchDay(matchDayWithAvailability(players), players);

    expect(analysis.possibleLineup).not.toBeNull();
    expect(analysis.mixedRuleCheck.passed).toBe(false);
    expect(analysis.status).toBe("critical");
  });
});

const seedPlayers = [
  player("Pia", Gender.Female, [Position.Middle, Position.Opposite], Position.Middle),
  player("Nina", Gender.Female, [Position.Outside, Position.Opposite], Position.Opposite),
  player("Dani", Gender.Female, [Position.Setter]),
  player("Caro", Gender.Female, [Position.Outside, Position.Opposite], Position.Opposite),
  player("Linda", Gender.Female, [Position.Libero, Position.Setter], Position.Setter),
  player("Ina", Gender.Female, [Position.Libero]),
  player("Andi", Gender.Male, [Position.Middle, Position.Setter, Position.Outside, Position.Opposite], Position.Outside),
  player("Lars", Gender.Male, [Position.Outside, Position.Opposite], Position.Outside),
  player("Stefan", Gender.Male, [Position.Middle, Position.Outside], Position.Outside),
  player("Volker", Gender.Male, [Position.Middle]),
  player("Michi", Gender.Male, [Position.Outside, Position.Middle], Position.Middle),
  player("Fran", Gender.Male, [Position.Middle]),
  player("Heli", Gender.Male, [Position.Middle]),
];

function player(name: string, gender: Gender, positions: Position[], primaryPosition = positions[0]): Player {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    gender,
    positions,
    primaryPosition,
  };
}

function validCoreLineupPlayers(): Player[] {
  return [
    player("Setter", Gender.Female, [Position.Setter]),
    player("Outside 1", Gender.Female, [Position.Outside]),
    player("Outside 2", Gender.Male, [Position.Outside]),
    player("Middle 1", Gender.Male, [Position.Middle]),
    player("Middle 2", Gender.Male, [Position.Middle]),
    player("Opposite", Gender.Male, [Position.Opposite]),
  ];
}

function matchDayWithAvailability(
  players: Player[],
  overrides: Record<string, AvailabilityStatus> = {},
): MatchDay {
  return {
    id: "match",
    title: "Test Match",
    type: "match",
    status: "open",
    date: "2026-04-20",
    opponent: "ESV Freimann",
    homeAway: "home",
    availability: players.map((currentPlayer) => ({
      matchDayId: "match",
      playerId: currentPlayer.id,
      status: overrides[currentPlayer.name] ?? AvailabilityStatus.Available,
    })),
  };
}
