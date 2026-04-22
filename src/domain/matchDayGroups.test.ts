import { describe, expect, it } from "vitest";
import { groupMatchDays } from "./matchDayGroups";
import { AvailabilityStatus, MatchDay } from "./types";

describe("groupMatchDays", () => {
  it("groups multiple date-finding polls of the same match into one dashboard group", () => {
    const groups = groupMatchDays([
      buildMatchDay({
        id: "poll-2",
        matchId: "match-1",
        opponent: "Loud'n'Proud",
        type: "date-finding",
        date: "2026-05-08",
      }),
      buildMatchDay({
        id: "poll-1",
        matchId: "match-1",
        opponent: "Loud'n'Proud",
        type: "date-finding",
        date: "2026-05-01",
      }),
    ]);

    expect(groups).toEqual([
      {
        kind: "group",
        matchId: "match-1",
        label: "Loud'n'Proud",
        matchDays: [
          expect.objectContaining({ id: "poll-1", date: "2026-05-01" }),
          expect.objectContaining({ id: "poll-2", date: "2026-05-08" }),
        ],
      },
    ]);
  });

  it("keeps scheduled matches as individual cards even when they share a match id", () => {
    const groups = groupMatchDays([
      buildMatchDay({
        id: "poll-1",
        matchId: "match-1",
        type: "match",
        appointmentStatus: "scheduled",
        date: "2026-05-01",
      }),
      buildMatchDay({
        id: "poll-2",
        matchId: "match-1",
        type: "date-finding",
        appointmentStatus: "planned",
        date: "2026-05-08",
      }),
    ]);

    expect(groups).toEqual([
      { kind: "single", matchDay: expect.objectContaining({ id: "poll-1" }) },
      { kind: "single", matchDay: expect.objectContaining({ id: "poll-2" }) },
    ]);
  });
});

function buildMatchDay(overrides: Partial<MatchDay> = {}): MatchDay {
  return {
    id: "poll-1",
    matchId: "match-1",
    appointmentId: "appointment-1",
    appointmentStatus: "planned",
    title: "Terminabstimmung",
    type: "date-finding",
    status: "open",
    date: "2026-05-01",
    time: "20:00",
    opponent: "Loud'n'Proud",
    homeAway: "home",
    location: "Lowhofer",
    sourceFixtureId: undefined,
    leagueGameNr: undefined,
    availability: [
      {
        matchDayId: "poll-1",
        playerId: "player-1",
        status: AvailabilityStatus.Available,
      },
    ],
    ...overrides,
  };
}
