import { describe, expect, it } from "vitest";
import { buildLowhoferOutcomeScenarios, getLowhoferRank, getProjectedLowhoferRank } from "./leagueTable";
import { LeagueStanding } from "./leagueTypes";
import { MatchDay } from "./types";

describe("leagueTable rank projection", () => {
  it("does not predict a rank gain when Lowhofer beat Forza but still stay behind on points", () => {
    const standings = [
      buildStanding({ team: "To The Top!", points: 22, wins: 10, setsWon: 22, setsLost: 6, ballsWon: 682, ballsLost: 563, games: 12 }),
      buildStanding({ team: "Blockbusters", points: 21, wins: 8, setsWon: 21, setsLost: 15, ballsWon: 807, ballsLost: 770, games: 14 }),
      buildStanding({ team: "Forza Ragazzi", points: 20, wins: 9, setsWon: 20, setsLost: 11, ballsWon: 725, ballsLost: 652, games: 12 }),
      buildStanding({ team: "BavUA", points: 18, wins: 8, setsWon: 18, setsLost: 16, ballsWon: 796, ballsLost: 748, games: 13 }),
      buildStanding({ team: "Die lowhofer", points: 12, wins: 5, setsWon: 12, setsLost: 15, ballsWon: 592, ballsLost: 611, games: 12 }),
      buildStanding({ team: "ESV Freimann", points: 11, wins: 4, setsWon: 11, setsLost: 17, ballsWon: 592, ballsLost: 648, games: 12 }),
      buildStanding({ team: "FIX WIE NIX", points: 9, wins: 3, setsWon: 9, setsLost: 24, ballsWon: 670, ballsLost: 813, games: 14 }),
      buildStanding({ team: "Loud'n'Proud", points: 8, wins: 3, setsWon: 8, setsLost: 17, ballsWon: 524, ballsLost: 583, games: 11 }),
    ];

    expect(getLowhoferRank(standings)).toBe(5);
    expect(getProjectedLowhoferRank(standings, "Forza Ragazzi", { lowhoferSets: 2, opponentSets: 0 })).toBe(5);
    expect(getProjectedLowhoferRank(standings, "Forza Ragazzi", { lowhoferSets: 2, opponentSets: 1 })).toBe(5);

    const scenarios = buildLowhoferOutcomeScenarios(standings, buildMatchDay({ opponent: "Forza Ragazzi" }));
    expect(scenarios.find((scenario) => scenario.label === "2:0")).toEqual(expect.objectContaining({ lowhoferRank: 5, rankTrend: "same" }));
    expect(scenarios.find((scenario) => scenario.label === "2:1")).toEqual(expect.objectContaining({ lowhoferRank: 5, rankTrend: "same" }));
  });

  it("predicts a rank gain when a win moves Lowhofer past the next team", () => {
    const standings = [
      buildStanding({ team: "Top Team", points: 18, wins: 8, setsWon: 18, setsLost: 6, ballsWon: 500, ballsLost: 400, games: 12 }),
      buildStanding({ team: "Runner Up", points: 16, wins: 7, setsWon: 16, setsLost: 10, ballsWon: 480, ballsLost: 430, games: 12 }),
      buildStanding({ team: "Die lowhofer", points: 14, wins: 6, setsWon: 14, setsLost: 11, ballsWon: 460, ballsLost: 440, games: 12 }),
      buildStanding({ team: "Forza Ragazzi", points: 15, wins: 6, setsWon: 15, setsLost: 12, ballsWon: 455, ballsLost: 445, games: 12 }),
    ];

    expect(getLowhoferRank(standings)).toBe(4);
    expect(getProjectedLowhoferRank(standings, "Forza Ragazzi", { lowhoferSets: 2, opponentSets: 0 })).toBe(3);

    const scenarios = buildLowhoferOutcomeScenarios(standings, buildMatchDay({ opponent: "Forza Ragazzi" }));
    expect(scenarios.find((scenario) => scenario.label === "2:0")).toEqual(expect.objectContaining({ lowhoferRank: 3, rankTrend: "up" }));
  });
});

function buildStanding(overrides: Partial<LeagueStanding> & Pick<LeagueStanding, "team">): LeagueStanding {
  return {
    points: 0,
    wins: 0,
    setsWon: 0,
    setsLost: 0,
    ballsWon: 0,
    ballsLost: 0,
    games: 0,
    ...overrides,
  };
}

function buildMatchDay(overrides: Partial<MatchDay> = {}): MatchDay {
  return {
    id: "poll-1",
    matchId: "match-1",
    appointmentId: "appointment-1",
    appointmentStatus: "scheduled",
    title: "Ligaspiel",
    type: "match",
    status: "open",
    date: "2026-04-25",
    time: "20:00",
    opponent: "Forza Ragazzi",
    homeAway: "away",
    location: "Sporthalle",
    sourceFixtureId: undefined,
    leagueGameNr: undefined,
    availability: [],
    ...overrides,
  };
}
